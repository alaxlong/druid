#!/bin/bash

DRUID_VERSION='0.13.0'
DRUID_DOWNLOAD_URL="http://ftp.itu.edu.tr/Mirror/Apache/incubator/druid/$DRUID_VERSION-incubating/apache-druid-$DRUID_VERSION-incubating-bin.tar.gz"

ZK_VERSION='3.4.11'
ZK_DOWNLOAD_URL="https://archive.apache.org/dist/zookeeper/zookeeper-$ZK_VERSION/zookeeper-$ZK_VERSION.tar.gz"

# druid
curl $DRUID_DOWNLOAD_URL -o druid-$DRUID_VERSION.bin.tar.gz
tar -xzf druid-$DRUID_VERSION.bin.tar.gz

# zookeeper
cd apache-druid-$DRUID_VERSION-incubating
curl $ZK_DOWNLOAD_URL -o zookeeper-$ZK_VERSION.tar.gz
tar -xzf zookeeper-$ZK_VERSION.tar.gz
mv zookeeper-$ZK_VERSION zk