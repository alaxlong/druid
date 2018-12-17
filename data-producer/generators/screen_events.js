'use strict'

const mustache = require('mustache');
const _ = require("lodash")
const faker = require("faker")
const util = require("util")

const viewEvents = [
  "viewStart",
  "viewStop"
]

const viewEventAttributes = {
  "viewLabel" : "{{viewLabel}}",
  "viewClass" : "{{viewClass}}",
  "viewId" : "{{viewId}}"
}

const views = _.times(10, faker.lorem.word)

function randomAttributes() {

  let view = _.sample(views)

  let viewName = util.format("%sScreen", view.charAt(0).toUpperCase() + view.substr(1).toLowerCase())

  return JSON.parse(mustache.render(JSON.stringify(viewEventAttributes), {viewLabel: viewName, viewClass: viewName, viewId: viewName}))
}

function generateEvent() {
  return {
    "name": _.sample(viewEvents),
    "attrs": randomAttributes()
  }
}

module.exports = {
  takeOne : generateEvent
}
