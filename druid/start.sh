#!/bin/bash

DRUID_VERSION='0.14.0'
DRUID_DIR=$2

CONF_DIR_SINGLE_NODE=$3
CONF_SINGLE_NODE=$CONF_DIR_SINGLE_NODE/single-node.conf

HELP="Usage: start.sh (single|cluster)"
HELP_SINGLE="Usage: start.sh single <druid dir> <druid conf>"

if [ $# -lt 1 ]; then
    echo $HELP
    exit
fi

if [ "$1" == "cluster" ]; then
    echo "Refer to setup folder for swarm mode!"
    exit
else
    if [ $# -lt 2 ]; then
        echo $HELP_SINGLE
        exit
    fi

    echo 'starting druid services...'
    rm -rf $DRUID_DIR/var
    rm -rf $DRUID_DIR/conf/single-node
    mkdir -p $DRUID_DIR/conf/single-node

    cp -r $CONF_DIR_SINGLE_NODE/druid $DRUID_DIR/conf/single-node/
    cp -r $CONF_DIR_SINGLE_NODE/zk $DRUID_DIR/conf/single-node/

    $DRUID_DIR/bin/supervise -c $CONF_SINGLE_NODE
fi
