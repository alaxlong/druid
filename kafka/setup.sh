#!/bin/bash

YML="docker/kafka-template.yml"

TOPIC_EVENTS="events"
TOPIC_USERS="users"

ZOOKEPER="zookeeper:12181"

REPL_FACTOR=1
PARTITIONS=3

# Create topics
docker-compose --file $YML exec broker kafka-topics --create \
--zookeeper $ZOOKEPER \
--replication-factor $REPL_FACTOR \
--partitions $PARTITIONS \
--topic $TOPIC_EVENTS

docker-compose --file $YML exec broker kafka-topics --create \
--zookeeper $ZOOKEPER \
--replication-factor $REPL_FACTOR \
--partitions $PARTITIONS \
--topic $TOPIC_USERS

# List topics
docker-compose --file $YML exec broker kafka-topics --list --zookeeper $ZOOKEPER

# Connect
#docker-compose --file $YML exec broker connect-standalone /root/config/worker-json.properties /root/config/kafka-to-s3-json-gzip.properties
