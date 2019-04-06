#!/bin/bash

YML="docker/docker-compose-template.yml"

TOPIC_EVENTS="events-raw"
TOPIC_USERS="users-raw"

REPL_FACTOR=1 
PARTITIONS=3

# Create topics
docker-compose --file $YML exec broker kafka-topics --create \
--zookeeper zookeeper:2181 \
--replication-factor $REPL_FACTOR \
--partitions $PARTITIONS \
--topic $TOPIC_EVENTS

docker-compose --file $YML exec broker kafka-topics --create \
--zookeeper zookeeper:2181 \
--replication-factor $REPL_FACTOR \
--partitions $PARTITIONS \
--topic $TOPIC_USERS

# List topics
docker-compose --file $YML exec broker kafka-topics --list --zookeeper zookeeper:2181

# Connect
docker-compose --file $YML exec broker connect-standalone /root/config/worker-json.properties /root/config/kafka-to-s3-json-gzip.properties