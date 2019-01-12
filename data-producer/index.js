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
const DeviceGenerator = require("./generators/device_generator")
const SessionGenerator = require("./generators/session_generator")
const EventGenerator = require("./generators/event_generator")

const PERIOD = process.env.PERIOD_IN_MS || 2 * 1000;
const NUM_OF_USERS = process.env.NUM_OF_USERS || 3
const SESION_PER_USER = process.env.SESION_PER_USER || 1
const EVENTS_PER_SESSION = process.env.EVENTS_PER_SESSION || 1

const runMode = process.env.RUN_MODE || modes.GENERATE_AND_SEND_EVENTS_AND_USERS

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
      } else return scan(cursor, callback, finalize)
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

  _.times(NUM_OF_USERS, () => {

    let userInfo = userGenerator.generate()

    if (isProd()) {
      redis.set(userInfo[1]["aid"], JSON.stringify(userInfo[1]), redis.print)
    } else {
      console.log(JSON.stringify(userInfo[1]))
    }

  })
}

function readUsersFromRedisAndSendEvents() {

  console.log("GENERATE_AND_SEND_EVENTS_WITH_USERS_READ_FROM_REDIS")

  setInterval(() => {

    _.times(NUM_OF_USERS, () => {

      redis.send_command("RANDOMKEY", (err, aid) => {

        if (aid) {

          redis.get(aid, (err, user_info) => {

            if (user_info) {

              let json_user = JSON.parse(user_info)

              // create new device based on user's last device id
              let device_info = new DeviceGenerator(json_user["ldid"]).generate()

              // create user sessions
              _.times(SESION_PER_USER, () => {

                // create session events
                create_session_events(json_user, device_info)

              })

            } else {
              error(err)
            }

          })

        } else {
          error(err)
        }

      })

    })

  }, PERIOD)
}

function generateAndSendEventsAndUsers() {

  console.log("GENERATE_AND_SEND_EVENTS_AND_USERS")

  setInterval(() => {

    _.times(NUM_OF_USERS,() => {

      // create new user
      let user_info = userGenerator.generate()

      // create new device based on user's last device id
      let device_info = new DeviceGenerator(user_info[0]["ldid"]).generate()

      // create user sessions
      _.times(SESION_PER_USER, () => {

        // create session events
        create_session_events(user_info, device_info)

      })

      // send user
      sendUser(user_info[1], kafkaProducer)

    })

  }, PERIOD);

}

function create_session_events(user_info, device_info) {

  let session_info = new SessionGenerator().generate()
  let event_generator = new EventGenerator(device_info, session_info, user_info)

  let sessionStartTime = session_info[0]["startDateTime"]

  // fire clientSessionStart
  sendEvent(event_generator.generateEvent('clientSessionStart', sessionStartTime))

  // fire session events
  let sessionEvents = event_generator.generateSessionEvents(EVENTS_PER_SESSION, sessionStartTime)
  _.forEach(sessionEvents, sendEvent)

  // fire clientSessionStop
  sendEvent(event_generator.generateEvent('clientSessionStop', util.sessionStopTime(EVENTS_PER_SESSION, sessionStartTime)))

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
    // // console.log("here")
    // heapdump.writeSnapshot('./heapdump/' + Date.now() + '.heapsnapshot')
  }

}
