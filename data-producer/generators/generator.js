'use strict'

const mustache = require('mustache');

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

  appendAdditionalData() {
    // to override e.g this.template.data = {"key" : "value"}
  }

  generate() {
    this.exposeData()
    this.appendAdditionalData()
    return [this.exposedData, JSON.parse(mustache.render(JSON.stringify(this.template), this.getDataToPopulate()))]
  }
}
