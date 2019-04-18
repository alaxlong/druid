#!/bin/bash

DATA_VOLUME="/Users/can/Projects/poc-kafka-hadoop-spark/redis/data"
IMAGE="redis:5.0.3-alpine3.8"
PORT=6379

HELP='Usage: start <network:required> <reset:optional>'


reset() {
    echo "recreating redis data directory..."
    rm -rf $DATA_VOLUME
    mkdir -p $DATA_VOLUME
}

start() {

    NETWORK=$1

    if [ "$2" == "reset" ]; then
        reset
    fi

    echo 'removing existing redis container...'
    docker stop redis && docker rm -f redis

    echo 'starting redis container...'
    docker run -d --network=$NETWORK --name redis -v $DATA_VOLUME:/data -p $PORT:6379 $IMAGE
}

if [ $# -lt 1 ]; then
    echo $HELP
    exit 0
fi

start $1 $2
