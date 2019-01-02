# Takeaways

* Use Avro for serialization
* Use Parquet for HDFS storage/processing format
* Both Avro and Parquet require fixed schema
* KafkaConnect doesn't currently have JSON Parquet connector
* For **TimeBasedPartitioner** timezone is important
* Confluent's Schema Registry expects PLAINTEXT named listeners and security protocol map; otherwise it won't start. Details [here](https://github.com/confluentinc/schema-registry/issues/648)
* There's no easy way to write to S3 in avro format if the data on kafka is not serialized in avro and backed with a schema. Confluent doesn't have a solution out of the box.

ERROR io.confluent.admin.utils.cli.KafkaReadyCommand - Error while running kafka-ready.
ESC[32mschema-registry    |ESC[0m java.lang.RuntimeException: No endpoints found for security protocol [PLAINTEXT]. Endpoints found in ZK [{EXTERNAL=ec2-52-29-159-96.eu-central-1.compute.amazonaws.com:9092, INTERNAL=localhost:19092}]
ESC[32mschema-registry    |ESC[0m       at io.confluent.admin.utils.cli.KafkaReadyCommand.main(KafkaReadyCommand.java:143)

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
