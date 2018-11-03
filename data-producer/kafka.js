'use strict'

module.exports = {
  brokerHost : 'k1.corp.commencis.net:9092',
  timeout: 5000,
  producerOptions: {
    requireAcks: 1,
    ackTimeoutMs: 100,
    partitionerType : 0
  },
  topic : 'poc',
  compressionType : 1 // 1: gzip 0: no compression
};
