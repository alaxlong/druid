import moment from 'moment';
import _ from 'lodash';

const secondsBetweenEvents = _.sample(_.range(2,15))

export function nextEventTime(lastEventTime) {
  return moment(lastEventTime, "x").add(secondsBetweenEvents, "seconds").format("x")
}

export function getSessionStopTime(eventsPerSession, sessionStartTime) {
  return moment(sessionStartTime, "x").add(secondsBetweenEvents * (eventsPerSession+1), "seconds").format("x")
}

export function getSessionDuration(sessionStartTime, sessionStopTime) {
  return moment(sessionStopTime, "x") - moment(sessionStartTime, "x")
}
