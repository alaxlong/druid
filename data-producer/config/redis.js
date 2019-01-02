'use strict'

const redis = require('redis')

module.exports = redis.createClient(
  process.env.REDIS_PORT || 6379,
  process.env.REDIS_HOST || 'localhost'
)
