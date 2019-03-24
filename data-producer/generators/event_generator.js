import _ from 'lodash'
import uuid from 'uuid/v4';
import CommerceEvents from "./commerce_events"
import CustomEvents from "./custom_events"
import ViewEvents from "./screen_events"
import {nextEventTime} from "../util.js"
import mustache from 'mustache';

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
const SCENARIO_RANDOM = "random"
const SCENARIO_VIEW = "view"  
const SCENARIO_COMMERCE = "commerce"
const SCENARIO_CUSTOM = "custom" 

const scenarios = [
  SCENARIO_RANDOM,
  SCENARIO_VIEW,
  SCENARIO_COMMERCE,
  SCENARIO_CUSTOM
]

export let generate = (eventName,
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

export let generateSessionEvents = (numOfEvents,
                                        sessionStartTime,
                                        deviceInfo,
                                        clientSession,
                                        appconnectId,
                                        customerId) => {

  let scenario = process.env.EVENT_SCENARIO || _.sample(scenarios)

  let eventCreationTime = sessionStartTime

  return _.times(numOfEvents, () => {
    eventCreationTime = nextEventTime(eventCreationTime)
    return generateSessionEvent(scenario,
                                eventCreationTime,
                                deviceInfo,
                                clientSession,
                                appconnectId,
                                customerId)
  })

}

let newTemplate = (deviceInfo, clientSession, attributes) => {

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

let generateSessionEvent = (scenario,
                              eventCreationTime,
                              deviceInfo,
                              clientSession,
                              appconnectId,
                              customerId) => {
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

let generateCommerceEvent = (eventCreationTime,
                               deviceInfo,
                               clientSession,
                               appconnectId,
                               customerId) => {

  let event = CommerceEvents.takeOne()
  return generateEvent(event["name"],
                       event["attrs"],
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)
}

let generateCustomEvent = (eventCreationTime,
                             deviceInfo,
                             clientSession,
                             appconnectId,
                             customerId) => {

  return generateEvent(CustomEvents.takeOne(),
                       null,
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)

}

let generateViewEvent = (eventCreationTime,
                           deviceInfo,
                           clientSession,
                           appconnectId,
                           customerId) => {

  let event = ViewEvents.takeOne()
  return generateEvent(event["name"],
                       event["attrs"],
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId)

}

let generateRandomEvent = (eventCreationTime,
                             deviceInfo,
                             clientSession,
                             appconnectId,
                             customerId) => {

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

let generateEvent = (eventName,
                       attributes,
                       eventCreationTime,
                       deviceInfo,
                       clientSession,
                       appconnectId,
                       customerId) => {

  let template = newTemplate(deviceInfo, clientSession, attributes)

  return JSON.parse(mustache.render(JSON.stringify(template),
                                    getDataToPopulate(eventName,
                                                      eventCreationTime,
                                                      deviceInfo,
                                                      appconnectId,
                                                      customerId)))
}

let getDataToPopulate = (eventName, eventCreationTime, deviceInfo, appconnectId, customerId) => {

  return {
    eventId: uuid(),
    deviceId: deviceInfo["deviceId"],
    appconnectId: appconnectId,
    customerId: customerId,
    eventName: eventName,
    clientCreationDate: eventCreationTime
  }

}

export default {
  generate,
  generateSessionEvents,
  scenarios
}