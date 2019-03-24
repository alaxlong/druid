#!/bin/bash

YML="setup/docker-compose-template.yml"

TOPIC_EVENTS="poc-events"
TOPIC_USERS="poc-users"

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