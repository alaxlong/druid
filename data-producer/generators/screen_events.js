import _ from 'lodash';
import mustache from 'mustache';
import faker from "faker"
import util from "util"

const viewEvents = [
  "viewStart",
  "viewStop"
]

const viewEventAttributes = {
  "viewLabel" : "{{viewLabel}}",
  "viewClass" : "{{viewClass}}",
  "viewId" : "{{viewId}}"
}

const views = _.times(100, faker.lorem.word)

let randomAttributes = () => {

  let view = _.sample(views)

  let viewName = util.format("%sScreen", view.charAt(0).toUpperCase() + view.substr(1).toLowerCase())

  return JSON.parse(mustache.render(JSON.stringify(viewEventAttributes), {viewLabel: viewName, viewClass: viewName, viewId: viewName}))
}

let generateEvent = () => {
  return {
    "name": _.sample(viewEvents),
    "attrs": randomAttributes()
  }
}

export default {
  takeOne : generateEvent
}
