#!/bin/bash

EC2_TYPE_DATA="m5a.2xlarge"
EC2_TYPE_QUERY="m5a.2xlarge"
EC2_TYPE_MANAGER="m5a.xlarge"
EC2_TYPE_KAFKA="m5a.xlarge"
EC2_TYPE_PRODUCER="m5a.2xlarge"

STACK_YML=stack-druid.yml
STACK_NAME=druid-demo

KEY_PAIR=druid-demo
SEC_GROUP=druid-demo
SSH_USER=ubuntu

AWS_PROFILE=commencis-poc

AMI_UBUNTU_18_LTS="ami-090f10efc254eaf55"

SCRIPT_CREATE_NETWORK="create-network.sh"
SCRIPT_INSTALL_DOCKER="install-docker.sh"

CONF='./conf'
CONF_DRUID=$CONF/conf-druid
CONF_KCONNECTORS=$CONF/conf-kconnect

AWS_SECRETS='./aws'

S3_ACCESS_KEYS=aws-s3-access

TOPIC_EVENTS=events
TOPIC_USERS=users

# todo : fetch these
manager="ec2-35-158-44-1.eu-central-1.compute.amazonaws.com"
kafka="ec2-3-122-55-75.eu-central-1.compute.amazonaws.com"
data1="ec2-35-159-21-192.eu-central-1.compute.amazonaws.com"
data2="ec2-18-194-88-251.eu-central-1.compute.amazonaws.com"
data3="ec2-3-120-37-208.eu-central-1.compute.amazonaws.com"
query="ec2-54-93-214-35.eu-central-1.compute.amazonaws.com"
producer="ec2-52-59-214-179.eu-central-1.compute.amazonaws.com"

# todo : fetch these
node_manager="ip-172-31-47-95"
node_kafka="ip-172-31-40-46"
node_data_1="ip-172-31-34-171"
node_data_2="ip-172-31-38-116"
node_data_3="ip-172-31-36-12"
node_query="ip-172-31-23-128"
node_producer="ip-172-31-21-84"

node_type_data="data"
node_type_query="query"
node_type_manager="manager"
node_type_producer="producer"
node_type_kafka="kafka"

copy_ssh_key() {
    cat ~/.ssh/id_rsa.pub | ssh -i $KEY_PAIR.pem $SSH_USER@$1 "cat >> .ssh/authorized_keys"
}

copy_ssh_keys() {
    copy_ssh_key $manager
    copy_ssh_key $kafka   
    copy_ssh_key $data1
    copy_ssh_key $data2
    copy_ssh_key $data3
    copy_ssh_key $query
    copy_ssh_key $producer
}

install_docker_on_nodes() {
    install_docker $manager
    install_docker $kafka
    install_docker $data1
    install_docker $data2
    install_docker $data3
    install_docker $query
    install_docker $producer
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
    copy $CONF_DRUID $data2
    copy $CONF_DRUID $data3
    copy $CONF_DRUID $query
    copy $CONF_DRUID $manager     

    # ingestion spec
    copy $CONF/event-ingestion-spec.json $manager

    # s3 sink
    copy $CONF/s3-sink.json $kafka
}

copy_connectors() {    
    copy $CONF_KCONNECTORS $kafka   
}

copy_to_each_node() {
    copy $1 $manager
    copy $1 $kafka  
    copy $1 $data1
    copy $1 $data2
    copy $1 $data3
    copy $1 $query
    copy $1 $producer
}

copy() {
    scp -rp $1 $SSH_USER@$2:~/
}

copy_stack() {
    copy $STACK_YML $manager    
}

remove_swarm() {

    execute "docker stack rm $STACK_NAME" $manager    

    remove_node $kafka  
    remove_node $data1
    remove_node $data2
    remove_node $data3
    remove_node $query
    remove_node $producer
    remove_node $manager

    execute "docker rm \$(docker ps -aq) && docker volume prune" $kafka
    execute "docker rm \$(docker ps -aq) && docker volume prune" $data1
    execute "docker rm \$(docker ps -aq) && docker volume prune" $data2
    execute "docker rm \$(docker ps -aq) && docker volume prune" $data3
    execute "docker rm \$(docker ps -aq) && docker volume prune" $query
    execute "docker rm \$(docker ps -aq) && docker volume prune" $producer
    execute "docker rm \$(docker ps -aq) && docker volume prune" $manager    

}

init_swarm() {

    # init manager
    execute "docker swarm init" $manager    

    token=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$5}'")
    url=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$6}'")

    # init workers
    join_node $kafka $token $url    
    join_node $data1 $token $url
    join_node $data2 $token $url
    join_node $data3 $token $url
    join_node $query $token $url
    join_node $producer $token $url

    # add labels    
    execute "docker node update --label-add node.type=$node_type_manager $node_manager" $manager    
    execute "docker node update --label-add node.type=$node_type_data $node_data_1" $manager
    execute "docker node update --label-add node.type=$node_type_data $node_data_2" $manager
    execute "docker node update --label-add node.type=$node_type_kafka $node_kafka" $manager
    execute "docker node update --label-add node.type=$node_type_data $node_data_3" $manager
    execute "docker node update --label-add node.type=$node_type_producer $node_producer" $manager
    execute "docker node update --label-add node.type=$node_type_query $node_query" $manager

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
        --count=1 \
        --name=druid-kafka \
        --instance-type=$EC2_TYPE_KAFKA \
        --ebs-vol-size=250 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # data
    eyws --profile $AWS_PROFILE create-instances \
        --count=3 \
        --name=druid-data \
        --instance-type=$EC2_TYPE_DATA \
        --ebs-vol-size=400 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP \
        --ami=$AMI_UBUNTU_18_LTS

    # query
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-query \
        --instance-type=$EC2_TYPE_QUERY \
        --ebs-vol-size=80 \
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

post_init() {

    # create kafka topics
    execute "docker exec -it $(docker ps -a | grep kafka-broker | awk '{print $1}') /opt/kafka/bin/kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor 1 \
        --partitions 3 \
        --topic $TOPIC_EVENTS" $kafka    

    execute "docker exec -it $(docker ps -a | grep kafka-broker | awk '{print $1}') /opt/kafka/bin/kafka-topics.sh --create \
        --zookeeper zookeeper:2181 \
        --replication-factor 1 \
        --partitions 3 \
        --topic $TOPIC_USERS" $kafka

    # Kafka connect    
    execute "curl -d @\"~/s3-sink.json\" -H \"Content-type: application/json\" -X POST localhost:18083/connectors" $kafka

    # initialize superset 
    execute "docker exec -it $(docker ps -a | grep superset | awk '{print $1}') superset-init" $query    
    
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
