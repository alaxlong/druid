'use strict'

const _ = require('lodash')
const uuid = require('uuid/v4');
const CommerceEvents = require("./commerce_events")
const CustomEvents = require("./custom_events")
const ViewEvents = require("./screen_events")
const util = require("../util.js")
const mustache = require('mustache');

// Event Categories
const EVENT_CATEGORY_VIEWS = "view"
const EVENT_CATEGORY_COMMERCE = "commerce"
const EVENT_CATEGORY_CUSTOM = "custom"

const eventCategories = [
  EVENT_CATEGORY_VIEWS,
  EVENT_CATEGORY_COMMERCE,
  EVENT_CATEGORY_CUSTOM
]

// Event Scenarios
const SCENARIO_RANDOM = "random" // generate from each event category
const SCENARIO_VIEW = "view"  // gnerate only view events
const SCENARIO_COMMERCE = "commerce" // generate only commerce events
const SCENARIO_CUSTOM = "custom"  // generate only custom events

const scenarios = [
  SCENARIO_RANDOM,
  SCENARIO_VIEW,
  SCENARIO_COMMERCE,
  SCENARIO_CUSTOM
]

module.exports.generate = (eventName,
                           eventCreationTime,
                           deviceInfo,
                           clientSession,
                           appconnectId,
                           customerId) => {

  let template = newTemplate(deviceInfo, clientSession, null)

  return JSON.parse(mustache.render(JSON.stringify(template),
                                    getDataToPopulate(eventName,
                                                      eventCreationTime,
                                                      deviceInfo,
                                                      appconnectId,
                                                      customerId)))

}

module.exports.generateSessionEvents = (numOfEvents,
                                        sessionStartTime,
                                        deviceInfo,
                                        clientSession,
                                        appconnectId,
                                        customerId) => {

  let scenario = _.sample(scenarios)

  let eventCreationTime = sessionStartTime

  return _.times(numOfEvents, () => {
    eventCreationTime = util.nextEventTime(eventCreationTime)
    return generateSessionEvent(scenario,
                                eventCreationTime,
                                deviceInfo,
                                clientSession,
                                appconnectId,
                                customerId)
  })

}

function newTemplate(deviceInfo, clientSession, attributes) {

  return {
    "eventId": "{{eventId}}",
    "deviceId": "{{deviceId}}",
    "appconnectId": "{{appconnectId}}",
    "customerId": "{{customerId}}",
    "eventName": "{{eventName}}",
    "clientCreationDate": "{{clientCreationDate}}",
    "deviceProperty": deviceInfo,
    "clientSession" : clientSession,
    "attributes" : attributes
  }

}

function generateSessionEvent(scenario,
                              eventCreationTime,
                              deviceInfo,
                              clientSession,
                              appconnectId,
                              customerId) {
  switch(scenario) {
    case SCENARIO_COMMERCE:
      return generateCommerceEvent(eventCreationTime,
                                   deviceInfo,
                                   clientSession,
                                   appconnectId,
                                   customerId)
    case SCENARIO_CUSTOM:
      return generateCustomEvent(eventCreationTime,
                                 deviceInfo,
                                 clientSession,
                                 appconnectId,
                                 customerId)
    case SCENARIO_VIEW:
      return generateViewEvent(eventCreationTime,
                               deviceInfo,
                               clientSession,
                               appconnectId,
                               customerId)
    case SCENARIO_RANDOM:
    default:
      return generateRandomEvent(eventCreationTime,
                                 deviceInfo,
                                 clientSession,
                                 appconnectId,
                                 customerId)
  }

}

function generateCommerceEvent(eventCreationTime,
                               deviceInfo,
                               clientSession,
                               appconnectId,
                               customerId) {

  let event = CommerceEvents.takeOne()
  return generateEvent(event["name"],
                       event["attrs"],
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)
}

function generateCustomEvent(eventCreationTime,
                             deviceInfo,
                             clientSession,
                             appconnectId,
                             customerId) {

  return generateEvent(CustomEvents.takeOne(),
                       null,
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)

}

function generateViewEvent(eventCreationTime,
                           deviceInfo,
                           clientSession,
                           appconnectId,
                           customerId) {

  let event = ViewEvents.takeOne()
  return generateEvent(event["name"],
                       event["attrs"],
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)

}

function generateRandomEvent(eventCreationTime,
                             deviceInfo,
                             clientSession,
                             appconnectId,
                             customerId) {

  let category = _.sample(eventCategories)

  switch (category) {
    case EVENT_CATEGORY_COMMERCE:
      return generateCommerceEvent(eventCreationTime,
                                   deviceInfo,
                                   clientSession,
                                   appconnectId,
                                   customerId)
    case EVENT_CATEGORY_VIEWS:
      return generateViewEvent(eventCreationTime,
                               deviceInfo,
                               clientSession,
                               appconnectId,
                               customerId)
    case EVENT_CATEGORY_CUSTOM:
    default:
      return generateCustomEvent(eventCreationTime,
                                 deviceInfo,
                                 clientSession,
                                 appconnectId,
                                 customerId)
  }

}

function generateEvent(eventName,
                       attributes,
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId) {

  let template = newTemplate(deviceInfo, clientSession, attributes)

  return JSON.parse(mustache.render(JSON.stringify(template),
                                    getDataToPopulate(eventName,
                                                      eventCreationTime,
                                                      deviceInfo,
                                                      appconnectId,
                                                      customerId)))
}

function getDataToPopulate(eventName, eventCreationTime, deviceInfo, appconnectId, customerId) {

  return {
    eventId: uuid(),
    deviceId: deviceInfo["deviceId"],
    appconnectId: appconnectId,
    customerId: customerId,
    eventName: eventName,
    clientCreationDate: eventCreationTime
  }

}
