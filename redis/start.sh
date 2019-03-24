#!/bin/bash

DATA_VOLUME="/Users/can/Projects/poc-kafka-hadoop-spark/redis/data"
IMAGE="redis:5.0.3-alpine3.8"

reset() {
    echo "recreating redis data directory..."
    rm -rf $DATA_VOLUME
    mkdir -p $DATA_VOLUME
}

start() {     
    if [ $# -lt 1 ]; then   
        echo 'Usage: start <network:required> <reset:optional>'
        exit 0
    fi

    NETWORK=$1

    if [ "$2" == "reset" ]
    then
        reset
    fi

    echo 'removing existing redis container...'
    docker stop redis && docker rm -f redis            

    echo 'starting redis container...'
    docker run -d --network=$NETWORK --name redis -v $DATA_VOLUME:/data -p 6379:6379 $IMAGE
}

start $1 $2