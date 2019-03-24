#!/bin/bash

YML="setup/docker-compose-template.yml"
DATA_FOLDER="/Users/can/Projects/poc-kafka-hadoop/data"

clear_dirs() {    
    rm -rf $DATA_FOLDER/zk-data
    rm -rf $DATA_FOLDER/zk-logs
    rm -rf $DATA_FOLDER/k1-data
    rm -rf $DATA_FOLDER/plugins
    rm -rf $DATA_FOLDER/connect-config
}

create_dirs() {    
    mkdir -p $DATA_FOLDER/zk-data
    mkdir -p $DATA_FOLDER/zk-logs
    mkdir -p $DATA_FOLDER/k1-data
    mkdir -p $DATA_FOLDER/plugins
    mkdir -p $DATA_FOLDER/connect-config
}

reset() {
    echo 'recreating kafka data directories...'
    clear_dirs
    create_dirs
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
    cp setup/local.env ./.env
    docker-compose --file $YML up
}

start $1