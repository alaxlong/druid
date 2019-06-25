#!/bin/bash

EC2_TYPE_DATA="m5a.2xlarge"     # historicals
EC2_TYPE_INGESTION="r5.4xlarge" # middlemanagers
EC2_TYPE_QUERY="m5a.2xlarge"    # broker
EC2_TYPE_MANAGER="m5a.xlarge"
EC2_TYPE_KAFKA="m5a.2xlarge"
EC2_TYPE_PRODUCER="m5a.4xlarge"

STACK_YML=stack-druid.yml
STACK_NAME=druid-demo

KEY_PAIR=druid-demo
SEC_GROUP=druid-demo
SSH_USER=ubuntu

AWS_PROFILE=commencis-poc

AMI_UBUNTU_18_LTS="ami-090f10efc254eaf55"

SCRIPT_CREATE_NETWORK="create-network.sh"
SCRIPT_INSTALL_DOCKER="install-docker.sh"

CONF='./config'
CONF_DRUID=$CONF/conf-druid
CONF_KCONNECTORS=$CONF/conf-kconnect
CONF_PROMETHEUS=$CONF/conf-prometheus

AWS_SECRETS='./aws'

S3_ACCESS_KEYS=aws-s3-access

TOPIC_EVENTS=events
TOPIC_USERS=users
NUM_OF_PARTITION=3
REPLICATION_FACTOR=1

# todo : fetch
URL_JMX_EXPORTER="https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.11.0/jmx_prometheus_javaagent-0.11.0.jar"

# todo : fetch these
manager="ec2-35-159-18-91.eu-central-1.compute.amazonaws.com"
ingestion1="ec2-52-59-220-106.eu-central-1.compute.amazonaws.com"
ingestion2="ec2-54-93-244-92.eu-central-1.compute.amazonaws.com"
kafka1="ec2-18-184-197-133.eu-central-1.compute.amazonaws.com"
data1="ec2-3-121-110-215.eu-central-1.compute.amazonaws.com"
query1="ec2-54-93-241-184.eu-central-1.compute.amazonaws.com"
producer1="ec2-18-195-186-223.eu-central-1.compute.amazonaws.com"
producer2="ec2-18-195-68-17.eu-central-1.compute.amazonaws.com"

# todo : fetch these
node_manager="ip-172-31-38-186"
node_ingestion_1="ip-172-31-24-71"
node_ingestion_2="ip-172-31-24-13"
node_kafka_1="ip-172-31-25-61"
node_data_1="ip-172-31-31-91"
node_query_1="ip-172-31-19-162"
node_producer_1="ip-172-31-2-234"
node_producer_2="ip-172-31-18-201"

node_type_data="data"
node_type_query="query"
node_type_manager="manager"
node_type_producer="producer"
node_type_kafka="kafka"
node_type_ingestion="ingestion"

copy_ssh_key() {
    cat ~/.ssh/id_rsa.pub | ssh -i $KEY_PAIR.pem $SSH_USER@$1 "cat >> .ssh/authorized_keys"
}

copy_ssh_keys() {
    copy_ssh_key $manager
    copy_ssh_key $kafka1    
    copy_ssh_key $data1
    copy_ssh_key $query1
    copy_ssh_key $producer1
    copy_ssh_key $producer2
    copy_ssh_key $ingestion1
    copy_ssh_key $ingestion2
}

install_docker_on_nodes() {
    install_docker $manager
    install_docker $kafka1    
    install_docker $data1            
    install_docker $query1    
    install_docker $producer1    
    install_docker $producer2
    install_docker $ingestion1
    install_docker $ingestion2
}

install_docker() {
    scp -p $SCRIPT_INSTALL_DOCKER $SSH_USER@$1:~/ &&
        ssh $SSH_USER@$1 /home/ubuntu/$SCRIPT_INSTALL_DOCKER &&
        ssh $SSH_USER@$1 sudo reboot
}

create_network() {
    scp -p $SCRIPT_CREATE_NETWORK $SSH_USER@$manager:~/ &&
        ssh $SSH_USER@$manager /home/ubuntu/$SCRIPT_CREATE_NETWORK
}

copy_configs() {

    # aws
    copy_to_each_node $AWS_SECRETS

    # druid
    cat $S3_ACCESS_KEYS >>$CONF_DRUID/druid/_common/common.runtime.properties

    copy $CONF_DRUID $data1    
    copy $CONF_DRUID $query1    
    copy $CONF_DRUID $manager
    copy $CONF_DRUID $ingestion1 
    copy $CONF_DRUID $ingestion2

    # ingestion spec
    copy $CONF/event-ingestion-spec.json $manager
    copy $CONF/apm-ingestion-spec.json $manager

    # s3 sink
    copy $CONF/s3-sink.json $manager    

    # prometheus
    copy $CONF_PROMETHEUS $kafka1
    copy $CONF_PROMETHEUS $query1
}

copy_connectors() {    
    copy $CONF_KCONNECTORS $kafka1    
}

copy_to_each_node() {
    copy $1 $manager
    copy $1 $kafka1    
    copy $1 $data1        
    copy $1 $query1    
    copy $1 $producer1
    copy $1 $producer2
    copy $1 $ingestion1
    copy $1 $ingestion2
}

copy() {
    scp -rp $1 $SSH_USER@$2:~/
}

copy_stack() {
    copy $STACK_YML $manager    
}

remove_swarm() {

    execute "docker stack rm $STACK_NAME" $manager    

    remove_node $kafka1    
    remove_node $data1    
    remove_node $query1    
    remove_node $producer1
    remove_node $producer2
    remove_node $manager
    remove_node $ingestion1
    remove_node $ingestion2

    execute "docker rm \$(docker ps -aq) && docker volume prune" $kafka1    
    execute "docker rm \$(docker ps -aq) && docker volume prune" $data1    
    execute "docker rm \$(docker ps -aq) && docker volume prune" $query1    
    execute "docker rm \$(docker ps -aq) && docker volume prune" $producer1  
    execute "docker rm \$(docker ps -aq) && docker volume prune" $producer2
    execute "docker rm \$(docker ps -aq) && docker volume prune" $manager
    execute "docker rm \$(docker ps -aq) && docker volume prune" $ingestion1
    execute "docker rm \$(docker ps -aq) && docker volume prune" $ingestion2

}

init_swarm() {

    # init manager
    execute "docker swarm init" $manager    

    token=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$5}'")
    url=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$6}'")

    # init workers
    join_node $kafka1 $token $url    
    join_node $data1 $token $url    
    join_node $query1 $token $url    
    join_node $producer1 $token $url
    join_node $producer2 $token $url 
    join_node $ingestion1 $token $url
    join_node $ingestion2 $token $url

    # add labels    
    execute "docker node update --label-add node.type=$node_type_manager $node_manager" $manager    
    execute "docker node update --label-add node.type=$node_type_data $node_data_1" $manager    
    execute "docker node update --label-add node.type=$node_type_kafka $node_kafka_1" $manager    
    execute "docker node update --label-add node.type=$node_type_producer $node_producer_1" $manager
    execute "docker node update --label-add node.type=$node_type_producer $node_producer_2" $manager    
    execute "docker node update --label-add node.type=$node_type_query $node_query_1" $manager    
    execute "docker node update --label-add node.type=$node_type_ingestion $node_ingestion_1" $manager
    execute "docker node update --label-add node.type=$node_type_ingestion $node_ingestion_2" $manager

}

execute() {
    ssh $SSH_USER@$2 $1
}

add_label() {
    ssh $SSH_USER:$1
}

remove_node() {
    execute "docker swarm leave --force" $1    
}

join_node() {
    execute "docker swarm join --token $2 $3" $1
}

login_docker_hub() {
    execute "docker login" $manager    
}

deploy_stack() {
    execute "docker stack deploy --compose-file $STACK_YML --with-registry-auth $STACK_NAME" $manager    
}

provision() {

    # manager
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-manager \
        --instance-type=$EC2_TYPE_MANAGER \
        --ebs-vol-size=100 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # kafka
    eyws --profile $AWS_PROFILE create-instances \
        --count=2 \
        --name=druid-kafka \
        --instance-type=$EC2_TYPE_KAFKA \
        --ebs-vol-size=900 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # data
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-data \
        --instance-type=$EC2_TYPE_DATA \
        --ebs-vol-size=800 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # ingestion
    eyws --profile $AWS_PROFILE create-instances \
        --count=2 \
        --name=druid-ingestion \
        --instance-type=$EC2_TYPE_INGESTION \
        --ebs-vol-size=200 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS        

    # query
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-query \
        --instance-type=$EC2_TYPE_QUERY \
        --ebs-vol-size=200 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # data-producer
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-data-producer \
        --instance-type=$EC2_TYPE_PRODUCER \
        --ebs-vol-size=50 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS
}

prepare() {
    
    echo 'copying ssh key to nodes...'
    copy_ssh_keys
    
    echo 'installing docker on nodes...'
    install_docker_on_nodes
   
}

init() {
     
    echo 'copying stack yml...'
    copy_stack
    
    echo 'copying config files..'
    copy_configs
    
    echo 'copying k connectors...'
    # copy_connectors
    
    echo 'initializing swarm...'
    init_swarm
    
    echo 'creating network...'
    create_network
    
    echo 'login docker hub..'
    # login_docker_hub
    
    echo 'deploying stack...'
    deploy_stack

}

create_topics() {

    execute "docker exec -t $1 /opt/kafka/bin/kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor $REPLICATION_FACTOR \
        --partitions $NUM_OF_PARTITION \
        --topic $TOPIC_EVENTS" $kafka1    

    execute "docker exec -t $1 /opt/kafka/bin/kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor $REPLICATION_FACTOR \
        --partitions $NUM_OF_PARTITION \
        --topic $TOPIC_USERS" $kafka1    
}

post_init() {

    # create kafka topics    
    kafka_container=$(ssh $SSH_USER@$kafka1 "docker ps --filter status=running | grep kafka-broker | awk '{print \$1}'")
    create_topics $kafka_container    

    # Kafka connect    
    execute "curl -d @\"/home/ubuntu/s3-sink.json\" -H \"Content-type: application/json\" -X POST localhost:18083/connectors" $manager
    # execute "curl -H \"Content-type: application/json\" -X DELETE localhost:18083/connectors/connect-s3-sink" $manager    

    # init superset manually : superset-init    
}

help() {
    echo "Usage setup (provision|prepare|init|post-init|remove|help|info)"
    exit
}

if [ $# -lt 1 ]; then
    help
fi

if [ "$1" == "provision" ]; then
    provision
elif [ "$1" == "prepare" ]; then
    prepare
elif [ "$1" == "init" ]; then
    init
elif [ "$1" == "post-init" ]; then
    post_init
elif [ "$1" == "remove" ]; then
    remove_swarm
elif [ "$1" == "help" ]; then
    help
elif [ "$1" == "info" ]; then    
    ssh $SSH_USER@$manager "docker stack services $STACK_NAME"
else
    echo "$1 not supported!"
fi