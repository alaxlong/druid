#!/bin/bash

build_and_push() {
    npm run build

    docker build -t canelmas/connect-data-producer:$1 .
    docker push canelmas/connect-data-producer:$1
}

if [ $# -lt 1 ]; then
    echo "Usage: start <version>"
    exit 0
else
    build_and_push $1
fi
