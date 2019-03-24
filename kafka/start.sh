#!/bin/bash

YML="docker/docker-compose-template.yml"
DATA_FOLDER="/Users/can/Projects/poc-kafka-hadoop/data"

clear_dirs() {    
    rm -rf $DATA_FOLDER/zk-data
    rm -rf $DATA_FOLDER/zk-logs
    rm -rf $DATA_FOLDER/k1-data
    rm -rf $DATA_FOLDER/plugins
    rm -rf $DATA_FOLDER/connect-config
    rm -rf $DATA_FOLDER/aws
}

create_dirs() {    
    mkdir -p $DATA_FOLDER/zk-data
    mkdir -p $DATA_FOLDER/zk-logs
    mkdir -p $DATA_FOLDER/k1-data
    mkdir -p $DATA_FOLDER/plugins
    mkdir -p $DATA_FOLDER/connect-config
    mkdir -p $DATA_FOLDER/aws
}

copy_files() {
    cp config/workers/worker-json.properties data/connect-config/
    cp config/sinks/kafka-to-s3-json-gzip.properties data/connect-config/
    cp config/aws/* data/aws/
    cp confluentinc-kafka-connect-s3-5.0.0.zip $DATA_FOLDER/plugins/
}

reset() {
    echo 'recreating kafka data directories...'
    clear_dirs
    create_dirs
    copy_files
}

start() {       

    if [ $# -lt 1 ]; then   
        echo 'Usage: start <reset:optional>'
        exit 0
    fi

    if [ "$1" == "reset" ]
    then
        reset
    fi

    echo 'starting kafka..'
    cp docker/local.env ./.env
    docker-compose --file $YML up
}

start $1