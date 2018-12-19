'use strict'

const faker = require('faker');
const uuid = require('uuid/v4');
const mustache = require('mustache');
const _ = require('lodash');
const util = require("./util")

const kafka = require('kafka-node');
const kafkaConf = require('./config/kafka');
const kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaConf.brokerHost, requestTimeout: kafkaConf.timeout});
const kafkaProducer = new kafka.Producer(kafkaClient, kafkaConf.producerOptions)

const userGenerator = require("./generators/user_generator");
const DeviceGenerator = require("./generators/device_generator")
const SessionGenerator = require("./generators/session_generator")
const EventGenerator = require("./generators/event_generator")

const PERIOD = process.env.PERIOD_IN_MS || 1 * 1000;
const NUM_OF_USERS = process.env.NUM_OF_USERS || 1
const SESION_PER_USER = process.env.SESION_PER_USER || 1
const EVENTS_PER_SESSION = process.env.EVENTS_PER_SESSION || 1

const mode = process.env.NODE_ENV || "development"

function isProd() {
  return mode == "production"
}

kafkaProducer.on('ready', function() {

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
      sendUser(user_info, kafkaProducer)

    })

  }, PERIOD);


})

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

kafkaProducer.on("error", (err) => {console.log("Error!\n%s", err)})

function sendUser(userInfo) {

  if (isProd()) {

    let user_payload = [{
      topic: kafkaConf.topics.users,
      messages: [JSON.stringify(userInfo[1])],
      attributes: kafkaConf.compressionType
    }]

    // send user
    kafkaProducer.send(user_payload, (err,data)=> {
      if (err) {
        console.log("Error producing!\n%s", err)
      } else {
        console.log(data)
      }
    })

  } else {
    console.log(userInfo[1])
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
    kafkaProducer.send(event_payload, (err,data)=> {
      if (err) {
        console.log("Error producing!\n%s", err)
      } else {
        console.log(data)
      }
    })

  } else {
    console.log(JSON.stringify(event))
  }

}
