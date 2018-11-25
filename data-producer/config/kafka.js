'use strict'

module.exports = {
  // brokerHost : 'k1.corp.commencis.net:9092',
  brokerHost : '192.168.1.23:9092',
  timeout: 5000,
  producerOptions: {
    requireAcks: 1,
    ackTimeoutMs: 100,
    partitionerType : 0
  },
  topics: {
    users: 'poc-users',
    events: 'poc-events'
  },
  compressionType : 1 // 1: gzip 0: no compression
};
