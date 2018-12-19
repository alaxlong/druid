#!/bin/bash
docker run -d --name=data-producer \
-e BROKER=ec2-52-29-159-96.eu-central-1.compute.amazonaws.com:9092 \
-e PERIOD=20000 \
-e NUM_OF_USERS=20 \
-e SESION_PER_USER=5 \
-e EVENTS_PER_SESSION=30 \
-e TOPICS_USERS=poc-users \
-e TOPICS_EVENTS=poc-events \
-e NODE_ENV=production canelmas/connect-data-producer:1.0.6
