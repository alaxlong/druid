'use strict'

const _ = require('lodash')
const Generator = require('./generator')
const uuid = require('uuid/v4');

const device_template = {
  "deviceProperty": {
    "deviceId": "{{deviceId}}",
    "timezone": "Europe/Istanbul",
    "language": "{{language}}",
    "country": "{{country}}",
    "appVersionName": "{{appVersionName}}",
    "appVersionCode": "{{appVersionCode}}",
    "appPackageName": "com.cnlms.lovelyapp",
    "platform": "{{platform}}",
    "deviceCategory": "{{deviceCategory}}",
    "deviceBrand": "{{deviceBrand}}",
    "deviceModel": "{{deviceModel}}",
    "osVersion": "{{osVersion}}",
    "sdkVersion": "1.0.0",
    "carrier": "{{carrier}}"
  }
}

module.exports = class DeviceGenerator extends Generator {

  constructor(deviceId) {
    super(device_template)
    this.deviceId = deviceId
  }

  exposeData() {
    this.exposedData = {
      "deviceId" : this.deviceId
    }
  }

  getDataToPopulate() {

    let platform = _.sample(["ANDROID", "iOS"]) // no web for now
    let brand = this.getDeviceBrand(platform)
    let model = this.getDeviceModel(brand)

    return {
      deviceId: this.deviceId,
      language: _.sample(["tr", "en", "fr", "it", "es"]),
      country : _.sample(["US", "TR", "ES", "PT", "PL", "UK", "NO", "MT", "KR", "IT", "DE"]),
      appVersionName: _.sample(["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.0.4", "1.0.5"]),
      appVersionCode: _.sample(["1", "2", "3", "4", "5", "6"]),
      platform: platform,
      deviceCategory: _.sample(["PHONE", "DESKTOP"]),
      deviceBrand: brand,
      deviceModel: model,
      osVersion: _.sample(["9", "24", "12.0.1", "10.13", "7.1.1", "11.4.1"]),
      carrier: _.sample(["Vodafone", "Turkcell", "Unknown", "Verizon", "Sprint"])
    }

  }

  getDeviceBrand(platform) {
    switch(platform) {
      case "ANDROID":
        return _.sample(["HTC", "Casper", "LGE", "Samsung", "General Mobile"])
      case "iOS":
        return "Apple"
    }
  }

  getDeviceModel(brand) {

    switch(brand) {
      case "Apple":
        return _.sample(["iPhone SE", "iPhone 7 Plus", "iPhone X", "iPhone 6"])
      default:
        return _.sample(["Nexus 5", "SM-G928C", "LG-D802", "SM-G610F", "Pixel", "GT-N7100"])
    }

  }

}
