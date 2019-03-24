import _ from 'lodash';

import { sessionStopTime } from "./util";
import { KafkaClient, Producer } from 'kafka-node';
import { brokerHost, timeout, producerOptions, topics, compressionType } from './config/kafka';
import redisClient from "./config/redis";
import modes from "./modes";

import UserGenerator from "./generators/user_generator";
import DeviceGenerator from "./generators/device_generator";
import SessionGenerator from "./generators/session_generator";
import EventGenerator from "./generators/event_generator";

const kafkaClient = new KafkaClient({
  kafkaHost: brokerHost,
  requestTimeout: timeout
});
const kafkaProducer = new Producer(kafkaClient, producerOptions)

const PERIOD = process.env.PERIOD_IN_MS || 5 * 1000;
const NUM_OF_USERS = process.env.NUM_OF_USERS || 1
const SESSION_PER_USER = process.env.SESSION_PER_USER || 1
const EVENTS_PER_SESSION = process.env.EVENTS_PER_SESSION || 1

const runMode = process.env.RUN_MODE || modes.GENERATE_AND_SEND_EVENTS_WITH_USERS_READ_FROM_REDIS

const mode = process.env.NODE_ENV || "development"

let isProd = () => {
  return mode == "production"
}

let exit = () => {
  process.exit()
}

let error = (err) => {
  console.error(err)
}

let info = (msg) => {
  console.info(msg)
}

redisClient.on('ready', () => {
  info("Redis [OK]")
})

redisClient.on('error', (err) => {
  error(`Redis [NOK] ${err}`)
  exit()
})

kafkaProducer.on("error", (err) => {
  error(`Kafka [NOK] ${err}`)
  exit()
})

kafkaProducer.on('ready', function () {
  info("Kafka [OK]")

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

let scanRedis = (cursor, callback, finalize) => {

  redisClient.scan(cursor, "MATCH", "*", "COUNT", 200, (err, reply) => {

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

let sendUsersOnRedis = () => {

  info("SEND_USERS_ON_REDIS")

  let cursor = 0

  scanRedis(cursor, (key) => {

    redisClient.get(key, (err, user_info) => {

      if (user_info) {
        sendUser(JSON.parse(user_info), kafkaProducer)
      } else {
        error(err)
      }
    })

  }, () => {
    info("Users read from Redis sent.")
  })

}

let generateAndPersistUsersOntoRedis = () => {

  info("GENERATE_AND_WRITE_USERS_TO_REDIS")

  for (var k = 0; k < NUM_OF_USERS; k++) {
    let userInfo = UserGenerator.generate()

    if (isProd()) {
      redisClient.set(userInfo["aid"], JSON.stringify(userInfo), redisClient.print)
    } else {
      info(JSON.stringify(userInfo))
    }
  }

  info(`${NUM_OF_USERS} users written onto Redis.`)

}

let readUsersFromRedisAndSendEvents = () => {

  info("GENERATE_AND_SEND_EVENTS_WITH_USERS_READ_FROM_REDIS") 

  setInterval(() => {

    for (var k = 0; k < NUM_OF_USERS; k++) {

      redisClient.send_command("RANDOMKEY", (err, aid) => {        

        if (aid) {          

          redisClient.get(aid, (err, userInfo) => {

            if (userInfo) {

              let jsonUser = JSON.parse(userInfo)              

              // create new device based on user's last device id
              let deviceInfo = DeviceGenerator.generate(jsonUser["ldid"])              

              // create user sessions
              for (var i = 0; i < SESSION_PER_USER; i++) {

                // create session events
                createAndSendSessionEvents(jsonUser, deviceInfo)

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

let generateAndSendEventsAndUsers = () => {

  info("GENERATE_AND_SEND_EVENTS_AND_USERS")

  setInterval(() => {

    for (var k = 0; k < NUM_OF_USERS; k++) {

      // create new user
      let userInfo = UserGenerator.generate()

      // create new device based on user's last device id
      let deviceInfo = DeviceGenerator.generate(userInfo["ldid"])

      // create user sessions
      for (var i = 0; i < SESSION_PER_USER; i++) {

        // create session events
        createAndSendSessionEvents(userInfo, deviceInfo)

      }

      // send user
      sendUser(userInfo, kafkaProducer)

    }

  }, PERIOD);

}

let createAndSendSessionEvents = (userInfo, deviceInfo) => {

  let sessionInfo = SessionGenerator.generate()

  let sessionStartTime = sessionInfo["clientSession"]["startDateTime"]

  // fire clientSessionStart
  sendEvent(EventGenerator.generate('clientSessionStart',
    sessionStartTime,
    deviceInfo,
    sessionInfo["clientSession"],
    userInfo["aid"],
    userInfo["cid"]))

  // fire session events
  let sessionEvents = EventGenerator.generateSessionEvents(EVENTS_PER_SESSION,
    sessionStartTime,
    deviceInfo,
    sessionInfo["clientSession"],
    userInfo["aid"],
    userInfo["cid"])

  _.forEach(sessionEvents, sendEvent)

  // fire clientSessionStop
  sendEvent(EventGenerator.generate('clientSessionStop',
    sessionStopTime(EVENTS_PER_SESSION, sessionStartTime),
    deviceInfo,
    sessionInfo["clientSession"],
    userInfo["aid"],
    userInfo["cid"]))

}

let sendUser = (userInfo) => {

  if (isProd()) {

    let user_payload = [{
      topic: topics.users,
      messages: [JSON.stringify(userInfo)],
      attributes: compressionType
    }]

    // send user
    kafkaProducer.send(user_payload, (err, result) => {
      if (err) {
        error(`Error producing! ${err}`)
      } else {
        info(result)
      }
    })

  } else {
    info(JSON.stringify(userInfo))
  }

}

let sendEvent = (event) => {

  if (isProd()) {

    let event_payload = [{
      topic: topics.events,
      messages: [JSON.stringify(event)],
      attributes: compressionType
    }]

    // send user
    kafkaProducer.send(event_payload, (err, result) => {
      if (err) {
        error(`Error producing! ${err}`)
      } else {
        info(result)
      }
    })

  } else {
    info(JSON.stringify(event))
  }

}