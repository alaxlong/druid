'use strict'

const mustache = require('mustache');
const uuid = require('uuid/v4')
const _ = require('lodash')

module.exports = class Generator {
  constructor(template) {
    this.template = template
  }

  getDataToPopulate(){
    throw new Error("Override this!")
  }

  exposeData() {
    this.exposedData = []
  }

  generate() {
    this.exposeData()
    return [this.exposedData, JSON.parse(mustache.render(JSON.stringify(this.template), this.getDataToPopulate()))]
  }
}
