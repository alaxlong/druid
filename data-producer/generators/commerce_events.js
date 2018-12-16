"use strict"

const mustache = require('mustache');
const _ = require('lodash')
const faker = require('faker');
const uuid = require('uuid/v4');
const util = require('util')

const inAppPurchaseAttributes = {
  "product_id" : "{{product_id}}",
  "description" : "{{description}}",
  "currency" : "{{currency}}",
  "price" : "{{price}}",
  "value" : "{{value}}",
  "num_of_items" : "{{num_of_items}}",
  "coupon_used" : "{{coupon_used}}",
  "tax" : "{{tax}}",
  "category" : "{{category}}",
  "sub_category": "{{sub_category}}",
  "trxid" : "{{trx_id}}"
}

const commerceEvents = [
  {"name": "in_app_purchase", "attrs" : inAppPurchaseAttributes},
  {"name": "view_content", "attrs": {"product_id": "{{product_id}}"}},
  {"name": "search_content", "attrs": {"keyword": "{{keyword}}"}},
  {"name": "add_to_wishlist", "attrs": {"product_id" : "{{product_id}}"}},
  {"name": "add_to_cart", "attrs" : {"product_id" : "{{product_id}}"}},
  {"name": "clear_cart", "attrs": null},
  {"name": "remove_from_cart", "attrs" : {"product_id" : "{{product_id}}"}},
  {"name": "error_add_to_cart", "attrs" : {"reason" : "{{reason}}"}},
  {"name": "start_checkout", "attrs" : null},
  {"name": "error_checkout", "attrs": {"reason" : "{{reason}}"}}
]

function getDataToPopulate() {

  let numOfItems = _.random(1, 10)
  let price = faker.commerce.price()
  let value = numOfItems * price
  let category = faker.commerce.product()
  let subCategory = util.format("%s-%s", category, _.random(1, 5))

  return {
    product_id: util.format("%s-%s", category, _.random(20,30)),
    keyword: faker.commerce.product(),
    reason : _.sample([100, 101, 102, 103, 104, 105]),
    description: faker.commerce.productName(),
    currency : "USD",
    price : price,
    value : value,
    num_of_items : numOfItems,
    coupon_used : faker.lorem.word().toUpperCase(),
    tax : price / 10,
    category : category,
    sub_category: subCategory,
    trx_id : uuid()
  }
}

function generateEvent() {
  let event = _.sample(commerceEvents)

  return {
    "name" : event["name"],
    "attrs": JSON.parse(mustache.render(JSON.stringify(event["attrs"]), getDataToPopulate()))
  }
}

module.exports = {
  takeOne : generateEvent
}
