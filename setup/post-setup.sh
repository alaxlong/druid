#!/bin/bash

create_topics() {
    
    ./kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor 1 \
        --partitions 2 \
        --topic users

    ./kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor 1 \
        --partitions 2 \
        --topic events
}