#!/bin/bash

YML="docker/kafka-template.yml"
KAFKA_CONNECT_S3_SINK="confluentinc-kafka-connect-s3-5.0.0.zip"

help() {
    echo "Usage : start.sh <bind_mount:required> <reset:optional>"
}

create_dirs() {    
    rm -rf $1    
    mkdir -p $1/aws    
    mkdir -p $1/connectors
    mkdir -p $1/prometheus
}

copy_files() { 
    cp -r config/aws/* $1/aws/    
    cp -r config/connectors/* $1/connectors/
    cp -r config/prometheus/* $1/prometheus/
}

clear_volumes() {
    docker volume rm zk-data
    docker volume rm zk-logs
    docker volume rm broker-logs  
    docker volume rm data-grafana
}

reset() {
    echo 'recreating kafka data directories...'    
    create_dirs $1
    copy_files $1
    clear_volumes    
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
