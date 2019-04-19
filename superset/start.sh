#!/bin/bash

CONTAINER_NAME="superset"
VERSION="0.28.1"

docker run -d --rm --name=$CONTAINER_NAME -p 8088:8088 amancevice/superset:$VERSION

docker exec -it $(docker ps -aqf "name=$CONTAINER_NAME") superset-init