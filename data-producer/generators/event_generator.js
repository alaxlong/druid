'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');
const moment = require('moment')

var eventTemplate = {
  "eventId": "{{eventId}}",
  "deviceId": "{{deviceId}}",
  "eventName": "{{eventName}}",
  "clientCreationDate": "{{clientCreationDate}}",
}

const events = [
  "left_menu_clicked",
  "dashboard_item_clicked",
  "logout_clicked",
  "kredi_kart_basvuru_step_1_completed",
  "kredi_kart_basvuru_step_2_completed",
  "kredi_kart_basvuru_step_3_completed",
  "kredi_kart_basvuru_step_4_completed",
  "user_logged_in"
]

module.exports = class EventGenerator extends Generator {

  constructor(deviceInfo, sessionInfo) {
    super(eventTemplate)    
    this.deviceInfo = deviceInfo
    this.sesionInfo = sessionInfo
    eventTemplate["deviceProperty"] = deviceInfo[1]["deviceProperty"]
    eventTemplate["clientSession"] = sessionInfo[1]["clientSession"]
  }

  exposeData() {
    this.exposedData = {
      "eventId" : uuid(),
      "clientCreationDate": this.eventCreationDate
    }
  }

  getDataToPopulate() {

    return {
      eventId: this.exposedData["eventId"],
      deviceId : this.deviceInfo[0]["deviceId"],
      eventName: this.eventName,
      clientCreationDate: this.eventCreationDate
    }

  }

  fireEvent(eventName, eventCreationDate) {
    this.eventName = eventName
    this.eventCreationDate = eventCreationDate
    return this.generate()
  }

  fireRandomEvent(eventCreationDate) {
    return this.fireEvent(_.sample(events), eventCreationDate)
  }

}
