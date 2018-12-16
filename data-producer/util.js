'use strict'

const moment = require("moment")

module.exports.nextEventTime = function(lastEventTime) {
  return moment(lastEventTime, "x").add(2, "seconds").format("x")
}

module.exports.sessionStopTime = function(eventsPerSession, sessionStartTime) {
  return moment(sessionStartTime, "x").add(2 * (eventsPerSession+1), "seconds").format("x")
}
