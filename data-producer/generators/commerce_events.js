import uuid from 'uuid/v4';
import faker from 'faker';
import _ from 'lodash';
import mustache from 'mustache';
import util from 'util'



let newPurchaseTemplate = () => {
  return {
    "value": "{{value}}",
    "currency": "{{currency}}",
    "coupon": "{{coupon}}",
    "tax": "{{tax}}",
    "ship": "{{ship}}",
    "discount": "{{discount}}",
    "paymentMethod": "{{payment_method}}",
    "trxid": "{{trx_id}}",
    "products": "{{products}}",
    "quantity": "{{quantity}}",
    "success": "{{success}}",
    "errorCode": "{{errorCode}}",
    "errorMessage": "{{errorMessage}}"
    // "attrs": null
  }
}

const commerceEvents = [
  {"name": "purchase", "attrs": newPurchaseTemplate()},
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

let newProductTemplate = () => {
  return {
    "id": "{{productId}}",
    "name": "{{name}}",
    "desc": "{{description}}",
    "brand": "{{brand}}",
    "quantity": "{{quantity}}",
    "price": "{{price}}",
    "variant": "{{variant}}",
    "category": "{{category}}",
    "currency": "{{currency}}"
  }  
}

let generateProduct = () => {

  let category = faker.commerce.product()

  let data = {
    productId: util.format("%s-%s", category, _.random(20, 30)),
    name: faker.commerce.productName(),
    description: faker.commerce.productName(),
    brand: "LovelyBrand",
    quantity: _.random(1, 5),
    price: faker.commerce.price(),
    variant: "blue",
    category: category,
    currency: "USD"
  }

  return JSON.parse(mustache.render(JSON.stringify(newProductTemplate()), data))
}

let getTotalQuantity = (products) => {
  let q = 0
  _.forEach(products, (product) => {
    q += product.quantity
  })
  return q
}

let getTotalValue = (products) => {
  let value = 0
  _.forEach(products, (product) => {
    value += (product.quantity * product.price)
  })
  return value
}

let getDataToPopulate = (products) => {

  let numOfItems = products.length
  let isSuccess = _.sample([true, false])
  let totalValue = getTotalValue(products)

  let price = faker.commerce.price()
  let value = numOfItems * price
  let category = faker.commerce.product()
  let subCategory = util.format("%s-%s", category, _.random(1, 5))

  return {
    value: totalValue,
    currency: "USD",
    coupon: faker.lorem.word(11).toUpperCase(),
    tax: totalValue / 20,
    ship: totalValue / 30,
    discount: totalValue / 40,
    paymentMethod: _.sample(["visa", "mastercard", "troy", "debit"]),
    trx_id: uuid(),
    products: products,
    quantity: getTotalQuantity(products),
    success: isSuccess,
    errorCode: isSuccess ? null : _.sample([100, 101, 102, 103, 104, 105]),
    errorMessage: isSuccess ? null : _.sample(["Error1", "Error2", "Error3"]),
    product_id: util.format("%s-%s", category, _.random(20,30)),
    // price : price,
    keyword: faker.commerce.product(),
    reason : _.sample([100, 101, 102, 103, 104, 105]),
    // description: faker.commerce.productName(),
    // num_of_items : numOfItems,
    category : category,
    sub_category: subCategory,
  }
}

let generateEvent = () => {
  let event = _.sample(commerceEvents)

  let numOfItems = _.random(1, 10)

  let products = []
  _.times(numOfItems, () => {
    products.push(generateProduct())
  })  
    
  return {
    "name": event["name"],
    "attrs": JSON.parse(mustache.render(JSON.stringify(event["attrs"]), getDataToPopulate(products)))
  }
}

export default {
  takeOne: generateEvent
}