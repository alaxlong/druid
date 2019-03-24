#!/bin/bash

docker stop data-producer && docker rm -f data-producer

docker run --name=data-producer \
--network lovely-net \
-e PERIOD_IN_MS=10000 \
-e NUM_OF_USERS=1 \
-e SESION_PER_USER=1 \
-e EVENTS_PER_SESSION=10 \
-e TOPICS_USERS=poc-users \
-e TOPICS_EVENTS=poc-events \
-e RUN_MODE=0 \
-e EVENT_SCENARIO=random \
-e NODE_OPTIONS=--max_old_space_size=4096 \
-e REDIS_HOST=redis \
-e BROKER=broker:19092 \
-e NODE_ENV=production canelmas/connect-data-producer:$1