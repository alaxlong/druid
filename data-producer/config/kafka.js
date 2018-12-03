'use strict'

module.exports = {
  brokerHost : process.env.BROKER || 'ec2-52-29-159-96.eu-central-1.compute.amazonaws.com:9092',
  timeout: 20000,
  producerOptions: {
    requireAcks: 1,
    ackTimeoutMs: 1000,
    partitionerType : 0
  },
  topics: {
    users: process.env.TOPICS_USERS || 'poc-users',
    events: process.env.TOPICS_EVENTS || 'poc-events'
  },
  compressionType : 1 // 1: gzip 0: no compression
};
