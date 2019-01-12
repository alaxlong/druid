'use strict'

const _ = require('lodash')
const uuid = require('uuid/v4');
const faker = require('faker')
const moment = require('moment')
const mustache = require('mustache');

const sessionTemplate = {
  "clientSession": {
    "sessionId": "{{sessionId}}",
    "startDateTime": "{{startDateTime}}"
  }
}

module.exports.generate = () => {
  return JSON.parse(mustache.render(JSON.stringify(sessionTemplate), getDataToPopulate()))
}

function getDataToPopulate() {
  return {
    sessionId: uuid(),
    startDateTime : moment(faker.date.past()).format('x')
  }
}
