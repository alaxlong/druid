#!/bin/bash

YML="docker/kafka-template.yml"

TOPIC_EVENTS="events"
TOPIC_USERS="users"

ZOOKEPER="zookeeper:12181"

KCONNECT_NODES=("localhost:18083" "localhost:28083")

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

# Connect
for i in "${!KCONNECT_NODES[@]}"; do    
    curl ${KCONNECT_NODES[$i]}/connectors -XPOST -H 'Content-type: application/json' -H 'Accept: application/json' -d '{
        "name": "connect-s3-sink-'$i'",
        "config": {
            "topics": "events,users",
            "connector.class": "io.confluent.connect.s3.S3SinkConnector",
            "tasks.max" : 4,
            "flush.size": 50000,
            "s3.region" : "eu-west-1",
            "s3.bucket.name" : "byob-raw",
            "topics.dir": "topics",
            "storage.class" : "io.confluent.connect.s3.storage.S3Storage",
            "partitioner.class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
            "partition.duration.ms" : "3600000",
            "rotate.interval.ms": "-1",
            "path.format": "YYYY-MM-dd",
            "locale" : "US",
            "timezone" : "UTC",
            "schema.compatibility": "NONE",
            "format.class" : "io.confluent.connect.s3.format.json.JsonFormat"
        }
    }'
done

# List topics
docker-compose --file $YML exec broker kafka-topics --list --zookeeper $ZOOKEPER
