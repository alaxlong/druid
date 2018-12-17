'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');
const CommerceEvents = require("./commerce_events")
const CustomEvents = require("./custom_events")
const ViewEvents = require("./screen_events")
const util = require("../util.js")

const eventTemplate = {
  "eventId": "{{eventId}}",
  "deviceId": "{{deviceId}}",
  "appconnectId": "{{appconnectId}}",
  "customerId": "{{customerId}}",
  "eventName": "{{eventName}}",
  "clientCreationDate": "{{clientCreationDate}}"
}

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

module.exports = class EventGenerator extends Generator {

  constructor(deviceInfo, sessionInfo, user_info) {
    super(eventTemplate)
    this.deviceInfo = deviceInfo
    this.sesionInfo = sessionInfo
    this.user_info = user_info
    eventTemplate["deviceProperty"] = deviceInfo[1]["deviceProperty"]
    eventTemplate["clientSession"] = sessionInfo[1]["clientSession"]
  }

  exposeData() {
    this.exposedData = {
      "eventId": uuid(),
      "clientCreationDate": this.eventCreationDate
    }
  }

  getDataToPopulate() {

    return {
      eventId: this.exposedData["eventId"],
      deviceId: this.deviceInfo[0]["deviceId"],
      appconnectId: this.user_info[0]["aid"],
      customerId: this.user_info[0]["customerId"],
      eventName: this.eventName,
      clientCreationDate: this.exposedData["clientCreationDate"],
      attributes : this.attributes
    }

  }

  generateCommerceEvent(eventCreationDate) {
    let event = CommerceEvents.takeOne()
    return this.generateComplexEvent(event["name"], event["attrs"], eventCreationDate)
  }

  generateCustomEvent(eventCreationDate) {
    return this.generateEvent(CustomEvents.takeOne(), eventCreationDate)
  }

  generateViewEvent(eventCreationDate) {
    let event = ViewEvents.takeOne()
    return this.generateComplexEvent(event["name"], event["attrs"], eventCreationDate)
  }

  generateRandomEvent(eventCreationDate) {

    let category = _.sample(eventCategories)

    switch (category) {
      case EVENT_CATEGORY_COMMERCE:
        return this.generateCommerceEvent(eventCreationDate)
      case EVENT_CATEGORY_VIEWS:
        return this.generateViewEvent(eventCreationDate)
      case EVENT_CATEGORY_CUSTOM:
      default:
        return this.generateCustomEvent(eventCreationDate)
    }

  }

  generateEvent(eventName, eventCreationDate) {
    return this.generateComplexEvent(eventName, null, eventCreationDate)
  }

  generateComplexEvent(eventName, attributes, eventCreationDate) {
    this.eventName = eventName
    this.eventCreationDate = eventCreationDate
    eventTemplate["attributes"] = attributes
    return this.generate()[1]
  }

  generateSessionEvents(numOfEvents, timeStartingFrom) {

    let scenario = _.sample(scenarios)

    let eventCreationTime = timeStartingFrom

    return _.times(numOfEvents, () => {
      eventCreationTime = util.nextEventTime(eventCreationTime)
      return this.generateSessionEvent(scenario, eventCreationTime)
    })
  }

  generateSessionEvent(scenario, eventCreationTime) {
    switch(scenario) {
      case SCENARIO_COMMERCE:
        return this.generateCommerceEvent(eventCreationTime)
      case SCENARIO_CUSTOM:
        return this.generateCustomEvent(eventCreationTime)
      case SCENARIO_VIEW:
        return this.generateViewEvent(eventCreationTime)
      case SCENARIO_RANDOM:
      default:
        return this.generateRandomEvent(eventCreationTime)
    }

  }

}
