'use strict'

const uuid = require('uuid/v4');
const faker = require('faker');
const Generator = require('./generator')
const _ = require('lodash');

const user_template = {
  "appId": "{{appId}}",
  "email": "{{email}}",
  "phone": "{{phone}}",
  "aid": "{{appconnectId}}",
  "cid": "{{customerId}}",
  "nid": "{{nationalId}}",
  "ldid": "{{lastDeviceId}}",
  "fn": "{{firstName}}",
  "ln": "{{lastName}}",
  "gender": "{{gender}}",
  "dob": "{{dateOfBirth}}",
  "dids": [
    "{{lastDeviceId}}",
    "{{anotherDeviceId}}"
  ],
  "cat": "{{createdAt}}",
  "lma": "2018-03-05T21:30:48.789Z",
  "lsa": "2018-03-05T21:30:48Z"
}

class UserGenerator extends Generator {

  constructor() {
    super(user_template)
  }

  gender() { return _.sample(["male", "female", "other"]) }

  exposeData() {
    this.exposedData = {
      "aid" : uuid(),
      "ldid": uuid(),
      "customerId": uuid()
    }
  }

  getDataToPopulate() {

    return {
      appId: 'poc',
      email : faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      appconnectId: this.exposedData["aid"],
      customerId: this.exposeData["customerId"],
      nationalId: faker.finance.iban(),
      lastDeviceId: this.exposedData["ldid"],
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      gender: this.gender(),
      dob: faker.date.past(),
      anotherDeviceId: uuid(),
      createdAt: faker.date.past()
    }

  }

}

module.exports = new UserGenerator()
// "data": {
//       "total_borc": "12345",
//       "has_aktif_kredi": "12345",
//       "has_aktif_kredi_2": "12345",
//       "total_aktif_kredi": "12345",
//       "total_kart_basvuru": "12345",
//       "total_kred_basvuru_red": "12345",
//       "has_aktif_ev_kredi": "12345",
//       "total_kredi_kart": "12345",
//       "has_ek_kart": "12345",
//       "has_sanal_kart": "12345",
//       "total_kart_limit": "12345",
//       "has_kart_red": "12345",
//       "average_monthly_kart_spending" : "12",
//       "most_spending_city" : "23",
//       "total_products": "",
//       "max_products": "",
//       "max_products": "",
//       "total_value_last_1_year": "",
//       "city": "",
//       "ikamet_city": "",
//       "marital_status": "",
//       "num_of_kids": "",
//       "musteri_tipi": "",
//       "musteri_segment": "",
//       "first_activity": "",
//       "last_activity": "",
//       "activity_status": "",
//       "num_of_years": "",
//       "is_mensup": "",
//       "occupation_status": "",
//       "montly_income": "",
//       "last_education": "",
//       "is_maas_customer": "",
//       "is_isuni": "",
//       "is_kamu": "",
//       "is_emekli": "",
//       "occupation_segment": "",
//       "num_of_vehicle": "",
//       "num_of_houses": "",
//       "resid_country": "",
//     }
