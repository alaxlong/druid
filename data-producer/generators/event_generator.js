'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');
const CommerceEvents = require("./commerce_events")
const CustomEvents = require("./custom_events")

var eventTemplate = {
  "eventId": "{{eventId}}",
  "deviceId": "{{deviceId}}",
  "appconnectId": "{{appconnectId}}",
  "customerId": "{{customerId}}",
  "eventName": "{{eventName}}",
  "clientCreationDate": "{{clientCreationDate}}"
}

const eventCategories = [
  // "view",
  "commerce",
  "custom"
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
      clientCreationDate: this.exposedData["clientCreationDate"]
    }

  }

  generateCommerceEvent(eventCreationDate) {
    let event = CommerceEvents.take()
    return this.generateComplexEvent(event["name"], event["attrs"], eventCreationDate)
  }

  generateCustomEvent(eventCreationDate) {
    return this.generateEvent(CustomEvents.take(), eventCreationDate)
  }

  generateRandomEvent(eventCreationDate) {

    let category = _.sample(eventCategories)

    switch (category) {
      case "commerce":
        return this.generateCommerceEvent(eventCreationDate)
      case "custom":
      default:
        return this.generateCustomEvent(eventCreationDate)
    }

  }

  generateEvent(eventName, eventCreationDate) {
    return this.generateComplexEvent(eventName, null, eventCreationDate)
  }

  generateComplexEvent(eventName, attributes, eventCreationDate) {
    this.eventName = eventName
    this.attributes = attributes
    this.eventCreationDate = eventCreationDate
    return this.generate()
  }

}
