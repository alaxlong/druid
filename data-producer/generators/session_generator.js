'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');
const faker = require('faker')
const moment = require('moment')

const session_template = {
  "clientSession": {
    "sessionId": "{{sessionId}}",
    "startDateTime": "{{startDateTime}}"    
  }
}

module.exports = class SessionGenerator extends Generator {

  constructor() {
    super(session_template)
  }

  exposeData() {
    this.exposedData = {
      "sessionId" : uuid(),
      "startDateTime" : moment(faker.date.past()).format()
    }
  }

  getDataToPopulate() {

    return {
      sessionId: this.exposedData["sessionId"],
      startDateTime : this.exposedData["startDateTime"]
    }

  }

}
