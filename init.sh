#!/bin/bash

NETWORK="lovely-net"

start() {

    echo "Creating docker network..."
    docker network rm $NETWORK
    docker network create -d bridge $NETWORK
    
}

start