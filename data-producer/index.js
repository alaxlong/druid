'use strict'

const faker = require('faker');
const uuid = require('uuid/v4');
const mustache = require('mustache');
const eventTemplate = require("./event_template");

const kafka = require('kafka-node');
const kafkaConf = require('./kafka');
const kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaConf.brokerHost, requestTimeout: kafkaConf.timeout});
const kafkaProducer = new kafka.Producer(kafkaClient, kafkaConf.producerOptions)

const EVERY_SECONDS = 1000;

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
];

kafkaProducer.on('ready', function() {
  setInterval(function() {
    produceRandomEvent();
  }, EVERY_SECONDS);
})

kafkaProducer.on('error', function(err){
  console.log("Error!\n%s", err)
})

function produceRandomEvent() {

  var populateWith = {
    eventId : uuid(),
    deviceId: uuid(),
    eventName: getRandomElement(eventNames),
    clientCreationDate: new Date().toISOString()
  };

  let eventData = mustache.render(JSON.stringify(eventTemplate), populateWith)

  var payload = [{
    topic: kafkaConf.topic,
    messages: eventData,
    attributes: kafkaConf.compressionType
  }]

  kafkaProducer.send(payload, function(err, data){
    if (err) {
      console.log("Error producing!\n%s", err)
    } else {
      console.log(data)
    }
  })
}

function getRandomElement(items) {
  return items[Math.floor(Math.random()*items.length)];
}
