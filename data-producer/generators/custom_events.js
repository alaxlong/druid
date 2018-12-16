'use strict'

const _ = require('lodash')

const events = [
  "login",
  "left_menu_clicked",
  "dashboard_item_clicked",
  "payments_clicked",
  "help_button_clicked",
  "logout_clicked",
  "kredi_kart_basvuru_step_1_success",
  "kredi_kart_basvuru_step_2_success",
  "kredi_kart_basvuru_step_3_success",
  "kredi_kart_basvuru_step_1_failure",
  "kredi_kart_basvuru_step_2_failure",
  "kredi_kart_basvuru_step_3_failure",
]

module.exports.takeOne = () => {
  return _.sample(events)
}
