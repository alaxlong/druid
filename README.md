# Takeaways

* Use Avro for serialization
* Use Parquet for HDFS format
* Both requires fixed schema
* For **TimeBasedPartitioner** timezone is important

# Scenarios

* String serialization - String storage
* Avro serialization - Avro storage
* Avro serialization - Parquet storage


## Create ec2 instance for Kafka
```bash
eyws create-instances --profile commencis-poc -t m5.xlarge -e 80 -k bigdatapoc -c 1 --sec-group bigdatapoc
```
## Create ec2 instances for data producers
```bash
eyws create-instances --profile commencis-poc -t t3.large -e 10 -k bigdatapoc -c 2 --sec-group bigdatapoc --install-docker --name=data-producer --u ubuntu -i bigdatapoc.pem
```
## Run data producer
```bash
docker run -d \
  -e BROKER=ec2-52-29-159-96.eu-central-1.compute.amazonaws.com:9092 \
  -e PERIOD=10 -e NUM_OF_USERS=10 \
  -e NUM_OF_SESSION_FOR_EACH_USER=2 \
  -e NUM_OF_EVENTS_FOR_EACH_SESSION=20 \
  canelmas/connect-data-producer:1.0.0 \
```
## Create poc-events and poc-users topics
```bash
./kafka-topics.sh --create --topic poc-events --replication-factor 2 --partitions 2 --zookeeper zookeeper:2181
./kafka-topics.sh --create --topic poc-events --replication-factor 2 --partitions 2 --zookeeper zookeeper:2181
```
