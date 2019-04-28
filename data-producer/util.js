import moment from "moment";

export function nextEventTime(lastEventTime) {
  return moment(lastEventTime, "x").add(2, "seconds").format("x")
}

export function getSessionStopTime(eventsPerSession, sessionStartTime) {
  return moment(sessionStartTime, "x").add(2 * (eventsPerSession+1), "seconds").format("x")
}

export function getSessionDuration(sessionStartTime, sessionStopTime) {
  return moment(sessionStopTime, "x") - moment(sessionStartTime, "x")
}
