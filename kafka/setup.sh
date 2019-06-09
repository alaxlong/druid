#!/bin/bash

YML="docker/kafka-template.yml"

TOPIC_EVENTS="events"
TOPIC_USERS="users"

ZOOKEPER="zookeeper:12181"

KCONNECT_NODES=("localhost:18083")

REPL_FACTOR=1
PARTITIONS=2

# Create topics
docker-compose --file $YML exec broker /opt/kafka/bin/kafka-topics.sh --create \
    --zookeeper $ZOOKEPER \
    --replication-factor $REPL_FACTOR \
    --partitions $PARTITIONS \
    --topic $TOPIC_EVENTS

docker-compose --file $YML exec broker /opt/kafka/bin/kafka-topics.sh --create \
    --zookeeper $ZOOKEPER \
    --replication-factor $REPL_FACTOR \
    --partitions $PARTITIONS \
    --topic $TOPIC_USERS

# List topics
docker-compose --file $YML exec broker kafka-topics --list --zookeeper $ZOOKEPER

# Connect
for i in "${!KCONNECT_NODES[@]}"; do    
    curl ${KCONNECT_NODES[$i]}/connectors -XPOST -H 'Content-type: application/json' -H 'Accept: application/json' -d '{
        "name": "connect-s3-sink-'$i'",
        "config": {
            "topics": "events",
            "connector.class": "io.confluent.connect.s3.S3SinkConnector",
            "tasks.max" : 4,
            "flush.size": 200,
            "rotate.schedule.interval.ms": "-1",
            "rotate.interval.ms": "-1",
            "s3.region" : "eu-west-1",
            "s3.bucket.name" : "byob-raw",
            "s3.compression.type": "gzip",
            "topics.dir": "deneme",
            "storage.class" : "io.confluent.connect.s3.storage.S3Storage",
            "partitioner.class": "com.canelmas.kafka.connect.FieldAndTimeBasedPartitioner",
            "partition.duration.ms" : "3600000",            
            "path.format": "YYYY-MM-dd",
            "locale" : "US",
            "timezone" : "UTC",
            "schema.compatibility": "NONE",
            "format.class" : "io.confluent.connect.s3.format.json.JsonFormat",
            "timestamp.extractor": "RecordField",
            "timestamp.field" : "clientCreationDate",
            "partition.field" : "appId"
        }
    }'
done
