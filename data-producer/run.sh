#!/bin/bash
docker run -d --name=data-producer \
-e BROKER=ec2-52-29-159-96.eu-central-1.compute.amazonaws.com:9092 \
-e PERIOD=15000 \
-e NUM_OF_USERS=50 \
-e SESION_PER_USER=5 \
-e EVENTS_PER_SESSION=50 \
-e TOPICS_USERS=poc-users \
-e TOPICS_EVENTS=poc-events \
-e RUN_MODE=0 \
-e NODE_OPTIONS=--max_old_space_size=4096 \
-e NODE_ENV=production canelmas/connect-data-producer:1.1.0
