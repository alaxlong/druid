#!/bin/bash

CONTAINER_NAME="redis"
IMAGE="redis:5.0.3-alpine3.8"
PORT=6379

HELP='Usage: start <network:required> <bind_mount:required> <reset:optional>'

reset() {
    echo "recreating redis data directory..."
    rm -rf $1
    mkdir -p $1
}

start() { 

    if [ "$3" == "reset" ]; then
        reset $2
    fi

    echo 'removing existing redis container...'
    docker stop $CONTAINER_NAME && docker rm -f $CONTAINER_NAME

    echo 'starting redis container...'
    docker run -d --network=$1 --name $CONTAINER_NAME -v $2:/data -p $PORT:6379 $IMAGE
}

if [ $# -lt 2 ]; then
    echo $HELP
    exit 0
fi

start $1 $2
