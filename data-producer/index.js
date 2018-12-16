'use strict'

const faker = require('faker');
const uuid = require('uuid/v4');
const mustache = require('mustache');
const _ = require('lodash');
const moment = require("moment")

const kafka = require('kafka-node');
const kafkaConf = require('./config/kafka');
const kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaConf.brokerHost, requestTimeout: kafkaConf.timeout});
const kafkaProducer = new kafka.Producer(kafkaClient, kafkaConf.producerOptions)

const EVERY_SECONDS = process.env.PERIOD_IN_MS || 1 * 1000;

const NUM_OF_USERS = process.env.NUM_OF_USERS || 1
const NUM_OF_SESSION_FOR_EACH_USER = process.env.NUM_OF_SESSION_FOR_EACH_USER || 1
const NUM_OF_EVENTS_FOR_EACH_SESSION = process.env.NUM_OF_EVENTS_FOR_EACH_SESSION || 1

const userGenerator = require("./generators/user_generator");
const DeviceGenerator = require("./generators/device_generator")
const SessionGenerator = require("./generators/session_generator")
const EventGenerator = require("./generators/event_generator")

const mode = process.env.NODE_ENV || "dev"

function isProd() {
  return mode == "prod"
}

kafkaProducer.on('ready', function() {

  setInterval( () => {

    _.times(NUM_OF_USERS,() => {

      // create new user
      let user_info = userGenerator.generate()

      // create new device based on user's last device id
      let device_info = new DeviceGenerator(user_info[0]["ldid"]).generate()

      // create user sessions
      _.times(NUM_OF_SESSION_FOR_EACH_USER, () => {

        // create session events
        create_session_events(user_info, device_info)

      })

      // send user
      sendUser(user_info, kafkaProducer)

    })

  }, EVERY_SECONDS);


})

function create_session_events(user_info, device_info) {

  let session_info = new SessionGenerator().generate()
  let event_generator = new EventGenerator(device_info, session_info, user_info)

  // fire clientSessionStart
  let eventCreationDate = session_info[0]["startDateTime"]

  sendEvent(event_generator.generateEvent('clientSessionStart', eventCreationDate))

  // fire random events
  _.times(NUM_OF_EVENTS_FOR_EACH_SESSION, () => {
    eventCreationDate = nextEventCreationDate(eventCreationDate)
    sendEvent(event_generator.generateRandomEvent(eventCreationDate))
  })

  // fire clientSessionStop
  sendEvent(event_generator.generateEvent('clientSessionStop', nextEventCreationDate(eventCreationDate)))

}

kafkaProducer.on("error", (err)=> {console.log("Error!\n%s", err)})

function nextEventCreationDate(lastCreationDate) {
  return moment(lastCreationDate, "x").add(2, "seconds").format("x")
}

function sendUser(userInfo) {

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

}

function sendEvent(eventInfo) {

  if (!isProd()) {
    console.log(eventInfo[1])    
  }

  let event_payload = [{
    topic: kafkaConf.topics.events,
    messages: [JSON.stringify(eventInfo[1])],
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

}
