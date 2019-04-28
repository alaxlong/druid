#!/bin/bash

stop() {
    docker stop data-producer && docker rm -f data-producer
}

start() {
    docker run --name=data-producer -d --restart=always \
        --network $2 \
        -e PERIOD_IN_MS=10000 \
        -e NUM_OF_USERS=5 \
        -e SESSION_PER_USER=2 \
        -e EVENTS_PER_SESSION=20 \
        -e TOPICS_USERS=users \
        -e TOPICS_EVENTS=events \
        -e RUN_MODE=0 \
        -e EVENT_SCENARIO=random \
        -e NODE_OPTIONS=--max_old_space_size=4096 \
        -e REDIS_HOST=redis \
        -e REDIS_PORT=6379 \
        -e BROKER=broker:9092 \
        -e VERBOSE=true \
        -e NODE_ENV=production canelmas/data-producer:$1
}

if [ $# -lt 2 ]; then
    echo "Usage: start <version:required> <network:required>"
    exit 1
else
    stop
    start $1 $2
fi
