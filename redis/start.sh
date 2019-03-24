#!/bin/bash

DATA_VOLUME="/Users/can/Projects/poc-kafka-hadoop-spark/redis/data"
IMAGE="redis:5.0.3-alpine3.8"

reset() {
    echo "clearing existing data..."
    rm -rf $DATA_VOLUME
    mkdir -p $DATA_VOLUME
}

start() {        
    if [ "$1" == "reset" ]
    then
        reset
    fi

    echo 'starting redis..'    
    docker stop redis
    docker rm -f redis    
    docker run -d --name redis -v $DATA_VOLUME:/data -p 6379:6379 $IMAGE
}

start $1