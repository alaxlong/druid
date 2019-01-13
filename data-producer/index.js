'use strict'

// var heapdump = require('heapdump');
const faker = require('faker');
const uuid = require('uuid/v4');
const mustache = require('mustache');
const _ = require('lodash');
const util = require("./util")

const kafka = require('kafka-node');
const kafkaConf = require('./config/kafka');
const kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaConf.brokerHost, requestTimeout: kafkaConf.timeout});
const kafkaProducer = new kafka.Producer(kafkaClient, kafkaConf.producerOptions)

const modes = require("./modes")

const redis = require("./config/redis")

const userGenerator = require("./generators/user_generator");
const deviceGenerator = require("./generators/device_generator")
const sessionGenerator = require("./generators/session_generator")
const eventGenerator = require("./generators/event_generator")

const PERIOD = process.env.PERIOD_IN_MS || 10 * 1000;
const NUM_OF_USERS = process.env.NUM_OF_USERS || 100000
const SESION_PER_USER = process.env.SESION_PER_USER || 3
const EVENTS_PER_SESSION = process.env.EVENTS_PER_SESSION || 15

const runMode = process.env.RUN_MODE || modes.GENERATE_AND_WRITE_USERS_TO_REDIS

const mode = process.env.NODE_ENV || "development"

function isProd() {
  return mode == "production"
}

function exit(){
  process.exit()
}

function error(err) {
  console.error(err)
}

function print(err, result) {
  if (err) {
    console.log(err)
  } else {
    console.log(result)
  }
}

redis.on('error', (err) => {
  console.log(err)
})

kafkaProducer.on("error", (err) => { error(err) })

kafkaProducer.on('ready', function() {

  if (runMode == modes.SEND_USERS_ON_REDIS) {

    sendUsersOnRedis()

  } else if (runMode == modes.GENERATE_AND_WRITE_USERS_TO_REDIS) {

    generateAndPersistUsersOntoRedis()

  } else if (runMode == modes.GENERATE_AND_SEND_EVENTS_WITH_USERS_READ_FROM_REDIS) {

    readUsersFromRedisAndSendEvents()

  } else {

    generateAndSendEventsAndUsers()

  }

})

function scanRedis(cursor, callback, finalize) {

  redis.scan(cursor, "MATCH", "*", "COUNT", 200, (err,reply)=> {

    if (err) {
      throw err
    }

    cursor = reply[0]

    let keys = reply[1]

    if (cursor == 0 && keys.length == 0) {
      return finalize()
    } else {

      _.forEach(keys, (key) => {
        callback(key)
      })

      if (cursor == 0) {
        return finalize()
      } else return scanRedis(cursor, callback, finalize)

    }

  })

}

function sendUsersOnRedis() {

  console.log("SEND_USERS_ON_REDIS")

  let cursor = 0

  scanRedis(cursor, (key) => {

    redis.get(key, (err, user_info) => {

      if (user_info) {
        sendUser(JSON.parse(user_info), kafkaProducer)
      } else {
        error(err)
      }
    })

  }, () => { console.log("All users sent.")})

}

function generateAndPersistUsersOntoRedis() {

  console.log("GENERATE_AND_WRITE_USERS_TO_REDIS")

  for (var k = 0; k < NUM_OF_USERS; k++) {

    let userInfo = userGenerator.generate()

    if (isProd()) {
      redis.set(userInfo["aid"], JSON.stringify(userInfo), redis.print)
    } else {
      console.log(JSON.stringify(userInfo))
    }

  }

}

function readUsersFromRedisAndSendEvents() {

  console.log("GENERATE_AND_SEND_EVENTS_WITH_USERS_READ_FROM_REDIS")

  setInterval(() => {

    for (var k = 0; k < NUM_OF_USERS; k++) {

      redis.send_command("RANDOMKEY", (err, aid) => {

        if (aid) {

          redis.get(aid, (err, user_info) => {

            if (user_info) {

              let json_user = JSON.parse(user_info)

              // create new device based on user's last device id
              let device_info = deviceGenerator.generate(json_user["ldid"])

              // create user sessions
              for (var i = 0; i < SESION_PER_USER; i++) {

                // create session events
                create_session_events(json_user, device_info)

              }

            } else {
              error(err)
            }

          })

        } else {
          error(err)
        }

      })

    }

  }, PERIOD)
}

function generateAndSendEventsAndUsers() {

  console.log("GENERATE_AND_SEND_EVENTS_AND_USERS")

  setInterval(() => {

    for (var k = 0; k<NUM_OF_USERS; k++) {

      // create new user
      let user_info = userGenerator.generate()

      // create new device based on user's last device id
      let device_info = deviceGenerator.generate(user_info["ldid"])

      // create user sessions
      for (var i = 0; i < SESION_PER_USER; i++) {

        // create session events
        create_session_events(user_info, device_info)
        
      }

      // send user
      sendUser(user_info, kafkaProducer)

    }

  }, PERIOD);

}

function create_session_events(user_info, device_info) {

  let session_info = sessionGenerator.generate()

  let sessionStartTime = session_info["clientSession"]["startDateTime"]

  // fire clientSessionStart
  sendEvent(eventGenerator.generate('clientSessionStart',
                                    sessionStartTime,
                                    device_info,
                                    session_info["clientSession"],
                                    user_info["aid"],
                                    user_info["cid"]))

  // fire session events
  let sessionEvents = eventGenerator.generateSessionEvents(EVENTS_PER_SESSION,
                                                            sessionStartTime,
                                                            device_info,
                                                            session_info["clientSession"],
                                                            user_info["aid"],
                                                            user_info["cid"])
  _.forEach(sessionEvents, sendEvent)

  // fire clientSessionStop
  sendEvent(eventGenerator.generate('clientSessionStop',
                                    util.sessionStopTime(EVENTS_PER_SESSION, sessionStartTime),
                                    device_info,
                                    session_info["clientSession"],
                                    user_info["aid"],
                                    user_info["cid"]))

}

function sendUser(userInfo) {

  if (isProd()) {

    let user_payload = [{
      topic: kafkaConf.topics.users,
      messages: [JSON.stringify(userInfo)],
      attributes: kafkaConf.compressionType
    }]

    // send user
    kafkaProducer.send(user_payload, (err,result)=> {
      if (err) {
        error("Error producing! %s", err)
      } else {
        // console.log(result)
      }
    })

  } else {
    console.log(JSON.stringify(userInfo))
  }

}

function sendEvent(event) {

  if (isProd()) {

    let event_payload = [{
      topic: kafkaConf.topics.events,
      messages: [JSON.stringify(event)],
      attributes: kafkaConf.compressionType
    }]

    // send user
    kafkaProducer.send(event_payload, (err,result)=> {
      if (err) {
        error("Error producing! %s",err)
      } else {
        // console.log(result)
      }
    })

  } else {
    console.log(JSON.stringify(event))
    // heapdump.writeSnapshot('./heapdump/' + Date.now() + '.heapsnapshot')
  }

}
