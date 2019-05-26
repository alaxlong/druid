#!/bin/bash

query="ec2-54-93-214-35.eu-central-1.compute.amazonaws.com"

broker=$query:8082/druid/v2/?pretty

execute() {
    curl -X POST -H "Content-Type: application/json" $broker -w "@curl-format.txt" -s -o $1 -d @$2    
}

echo 'Event Count'
execute event_count event_count.json

echo ""

echo "Event Counts Grouped By Name"
execute event_count_by_name event_count_by_name.json

echo ""

echo "Daily Event Count"
execute event_count_daily event_count_daily.json

echo ""

echo "Daily Session Count"
execute session_count_daily session_count_daily.json

echo ""

echo "Unique User Count"
execute unique_user_count unique_user_count.json

echo ""

echo "Daily Unique User Count"
execute unique_user_count_daily unique_user_count_daily.json

echo ""

echo "Top 100 Screens"
execute top_100_screens top_100_screens.json

echo ""

echo "Top 100 Screens By Platform"
execute top_100_screens_by_platform top_100_screens_by_platform.json