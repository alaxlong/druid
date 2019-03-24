#!/bin/bash

npm run build

docker build -t canelmas/connect-data-producer:$1 .
docker push canelmas/connect-data-producer:$1