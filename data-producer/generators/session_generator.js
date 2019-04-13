import _ from 'lodash';
import uuid from 'uuid/v4';
import faker from 'faker';
import moment from 'moment';

let generate = () => {
  return {
    clientSession: {
      sessionId: uuid(),
      startDateTime: moment(faker.date.between(moment().subtract(14, "days"), moment())).format("x")
    }
  } 
}

export default { generate }