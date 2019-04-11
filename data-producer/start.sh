#!/bin/bash

stop() {
    docker stop data-producer && docker rm -f data-producer
}

start() {
    docker run --name=data-producer -d --rm --restart=always \
        --network lovely-net \
        -e PERIOD_IN_MS=10000 \
        -e NUM_OF_USERS= \
        -e SESSION_PER_USER=10 \
        -e EVENTS_PER_SESSION=30 \
        -e TOPICS_USERS=users \
        -e TOPICS_EVENTS=events \
        -e RUN_MODE=0 \
        -e EVENT_SCENARIO=random \
        -e NODE_OPTIONS=--max_old_space_size=4096 \
        -e REDIS_HOST=redis \
        -e BROKER=broker:19092 \
        -e VERBOSE=false \
        -e NODE_ENV=production canelmas/connect-data-producer:$1
}

if [ $# -lt 1 ]; then
    echo "Usage: start <version:required>"
    exit 1
else
    stop
    start $1
fi
