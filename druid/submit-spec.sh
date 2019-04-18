#!/bin/bash

DRUID_URL="http://localhost:8090"
HELP="Usage : submit-spec.sh (start|status|suspend|update|terminate) <spec json>"

if [ $# -lt 2 ]; then
    echo $HELP
    exit 1
fi

if [ "$1" == "start" ]; then        
    curl -X POST -H 'Content-Type: application/json' -d @$2 $DRUID_URL/druid/indexer/v1/supervisor | python -m json.tool
elif [ "$1" == "status" ]; then
    curl -X GET $DRUID_URL/druid/indexer/v1/supervisor/$2/status | python -m json.tool
elif [ "$1" == "suspend" ]; then
    curl -X POST $DRUID_URL/druid/indexer/v1/supervisor/$2/suspend | python -m json.tool
elif [ "$1" == "update" ]; then
    curl -X POST -H 'Content-Type: application/json' -d @$2 $DRUID_URL/druid/indexer/v1/supervisor | python -m json.tool    
elif [ "$1" == "terminate" ]; then
    curl -X POST $DRUID_URL/druid/indexer/v1/supervisor/$2/terminate | python -m json.tool
else
    echo "$1 not supported!"
fi