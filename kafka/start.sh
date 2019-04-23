#!/bin/bash

YML="docker/kafka-template.yml"
KAFKA_CONNECT_S3_SINK="confluentinc-kafka-connect-s3-5.0.0.zip"

help() {
    echo "Usage : start.sh <bind_mount:required> <reset:optional>"
}

create_dirs() {    
    rm -rf $1
    mkdir -p $1/plugins
    mkdir -p $1/connect
    mkdir -p $1/aws
}

copy_files() {
    cp config/workers/worker-json.properties $1/connect/
    cp config/sinks/kafka-to-s3-json-gzip.properties $1/connect/
    cp config/aws/* $1/aws/
    tar -C $1/plugins/ -zxf $KAFKA_CONNECT_S3_SINK
}

clear_volumes() {
    docker volume rm docker_zk-data
    docker volume rm docker_zk-logs
    docker volume rm docker_broker-logs  
}

create_network() {
    docker network rm kafka-net
    docker network create kafka-net
}

reset() {
    echo 'recreating kafka data directories...'    
    create_dirs $1
    copy_files $1
    clear_volumes
    create_network
}

start() {
    if [ "$2" == "reset" ]; then
        reset $1
    fi

    echo 'starting kafka..'
    cp docker/local.env ./.env
    docker-compose --file $YML up -d
}

if [ $# -lt 2 ]; then
    help
    exit
fi

start $1 $2
