'use strict'

const faker = require('faker');
const uuid = require('uuid/v4');
const mustache = require('mustache')
const eventTemplate = require("./event_template")

const EVERY_SECONDS = 1000

const eventNames = [
  "viewStart",
  "viewStop",
  "productPurchased",
  "clientSessionStart",
  "clientSessionStop",
  "logoutClicked",
  "loginClicked",
  "left_menu_clicked",
  "dashboard_menu_clicked"
]

setInterval(function() {
  postRandomEvent()  
}, EVERY_SECONDS)

function postRandomEvent() {

  var populateWith = {
    eventId : uuid(),
    deviceId: uuid(),
    eventName: getRandomElement(eventNames),
    clientCreationDate: new Date().toISOString()
  }

  console.log(mustache.render(JSON.stringify(eventTemplate), populateWith))
}

function getRandomElement(items) {
  return items[Math.floor(Math.random()*items.length)];
}
