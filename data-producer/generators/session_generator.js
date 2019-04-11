import _ from 'lodash';
import uuid from 'uuid/v4';
import faker from 'faker';
import moment from 'moment';
import mustache from 'mustache';

const sessionTemplate = {
  "clientSession": {
    "sessionId": "{{sessionId}}",
    "startDateTime": "{{startDateTime}}"
  }
}

let generate = () => {
  return JSON.parse(mustache.render(JSON.stringify(sessionTemplate), getDataToPopulate()))
}

let getDataToPopulate = () => {
  return {
    sessionId: uuid(),    
    startDateTime : moment(faker.date.between(moment().subtract(14, "days"), moment())).format("x")
  }
}

export default { generate }