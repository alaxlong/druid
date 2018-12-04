'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');

var eventTemplate = {
  "eventId": "{{eventId}}",
  "deviceId": "{{deviceId}}",
  "appconnectId" : "{{appconnectId}}",
  "customerId" : "{{customerId}}",
  "eventName": "{{eventName}}",
  "clientCreationDate": "{{clientCreationDate}}",
}

const events = [
  "left_menu_clicked",
  "dashboard_item_clicked",
  "logout_clicked",
  "kredi_kart_basvuru_step_1_viewed",
  "kredi_kart_basvuru_step_2_viewed",
  "kredi_kart_basvuru_step_3_viewed",
  "kredi_kart_basvuru_step_4_viewed",
  "kredi_kart_basvuru_step_1_success",
  "kredi_kart_basvuru_step_2_success",
  "kredi_kart_basvuru_step_3_success",
  "kredi_kart_basvuru_step_4_success",
  "kredi_kart_basvuru_step_1_failure",
  "kredi_kart_basvuru_step_2_failure",
  "kredi_kart_basvuru_step_3_failure",
  "kredi_kart_basvuru_step_4_failure",
  "user_logged_in"
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
      "eventId" : uuid(),
      "clientCreationDate": this.eventCreationDate
    }
  }

  getDataToPopulate() {

    return {
      eventId: this.exposedData["eventId"],
      deviceId : this.deviceInfo[0]["deviceId"],
      appconnectId: this.user_info[0]["aid"],
      customerId: this.user_info[0]["customerId"],
      eventName: this.eventName,
      clientCreationDate: this.exposedData["clientCreationDate"]
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
