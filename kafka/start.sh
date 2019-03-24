#!/bin/bash

YML="docker/docker-compose-template.yml"
DATA_FOLDER="/Users/can/Projects/poc-kafka-hadoop-spark/kafka/data"

clear_dirs() {    
    rm -rf $DATA_FOLDER/zk-data
    rm -rf $DATA_FOLDER/zk-logs
    rm -rf $DATA_FOLDER/k1-data
    rm -rf $DATA_FOLDER/plugins
    rm -rf $DATA_FOLDER/connect
    rm -rf $DATA_FOLDER/aws
}

create_dirs() {    
    mkdir -p $DATA_FOLDER/zk-data
    mkdir -p $DATA_FOLDER/zk-logs
    mkdir -p $DATA_FOLDER/k1-data
    mkdir -p $DATA_FOLDER/plugins
    mkdir -p $DATA_FOLDER/connect
    mkdir -p $DATA_FOLDER/aws
}

copy_files() {
    cp config/workers/worker-json.properties $DATA_FOLDER/connect/
    cp config/sinks/kafka-to-s3-json-gzip.properties $DATA_FOLDER/connect/
    cp config/aws/* $DATA_FOLDER/aws/    
    tar -C $DATA_FOLDER/plugins/ -zxf confluentinc-kafka-connect-s3-5.0.0.zip    
}

reset() {
    echo 'recreating kafka data directories...'
    clear_dirs
    create_dirs
    copy_files
}

start() {           
    if [ "$1" == "reset" ]
    then
        reset
    fi

    echo 'starting kafka..'
    cp docker/local.env ./.env
    docker-compose --file $YML up
}

start $1