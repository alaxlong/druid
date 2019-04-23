#!/bin/bash

EC2_TYPE_DATA="m5.2xlarge"
EC2_TYPE_QUERY="m5.2xlarge"
EC2_TYPE_MANAGER="m5.xlarge"
EC2_TYPE_KAFKA="m5.xlarge"
EC2_TYPE_PRODUCER="m5.2xlarge"

KEY_PAIR=druid-demo
SEC_GROUP=druid-demo
SSH_USER=ubuntu

AWS_PROFILE=commencis-poc

SCRIPT_CREATE_NETWORK="create-network.sh"
SCRIPT_INSTALL_DOCKER="install-docker.sh"

STACK_YML="stack-druid.yml"
STACK_NAME="druid-demo"

DRUID_CONF='./conf'
AWS_CONF='./aws'
AWS_SECRETS=aws-s3-access

# todo : fetch these
manager="ec2-18-184-246-181.eu-central-1.compute.amazonaws.com"
kafka="ec2-3-120-227-217.eu-central-1.compute.amazonaws.com"
data0="ec2-3-122-229-6.eu-central-1.compute.amazonaws.com"
query="ec2-52-59-242-215.eu-central-1.compute.amazonaws.com"
producer="ec2-18-197-144-82.eu-central-1.compute.amazonaws.com"

# todo : fetch these
node_manager="ip-172-31-46-24"
node_query="ip-172-31-42-68"
node_data="ip-172-31-35-29"
node_producer="ip-172-31-34-201"
node_kafka="ip-172-31-47-121"

node_type_data="data"
node_type_query="query"
node_type_manager="manager"
node_type_producer="producer"
node_type_kafka="kafka"

wtf() {
    echo "
                        vCPU	ECU	    Memory (GiB)	Instance Storage (GB)	Linux/UNIX Usage            
            m5.xlarge	4	    16	    16 GiB	        EBS Only	            $ 0.23 per Hour
            m5.2xlarge	8	    31	    32 GiB	        EBS Only	            $ 0.46 per Hour

    1 x $EC2_TYPE_MANAGER for MASTER (management, router, superset)  => $ 5.02 per day
    1 x $EC2_TYPE_MANAGER for KAFKA (kafka, zookeeper)  => $ 5.02 per day
    1 x $EC2_TYPE_DATA for DATA (historicals and middlemanagers) => $  5.02 per day
    1 x $EC2_TYPE_QUERY for QUERY (druid brokers) => $ 11.04 per day
    1 x $EC2_TYPE_PRODUCER for PRODUCER (data-producer) => $ 11.04 per day

    Total EC2 Cost => ~38 $ per day
    "
}

copy_ssh_key() {
    cat ~/.ssh/id_rsa.pub | ssh -i $KEY_PAIR.pem $SSH_USER@$1 "cat >> .ssh/authorized_keys"
}

copy_ssh_keys() {
    copy_ssh_key $manager
    copy_ssh_key $kafka
    copy_ssh_key $data    
    copy_ssh_key $query
    copy_ssh_key $producer
}

install_docker_on_nodes() {
    install_docker $manager
    install_docker $kafka
    install_docker $data    
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

    cat $AWS_SECRETS >>$DRUID_CONF/druid/_common/common.runtime.properties

    copy_config common-event-spec.json $manager

    copy_config $AWS_CONF $manager
    copy_config $AWS_CONF $kafka
    copy_config $AWS_CONF $data    
    copy_config $AWS_CONF $query
    copy_config $AWS_CONF $producer

    copy_config $DRUID_CONF $manager
    copy_config $DRUID_CONF $kafka
    copy_config $DRUID_CONF $data    
    copy_config $DRUID_CONF $query
    copy_config $DRUID_CONF $producer

    # docker exec -it be0684a3bfc1 superset-init
}

copy_config() {
    scp -rp $1 $SSH_USER@$2:~/
}

copy_stack() {
    scp -p $STACK_YML $SSH_USER@$manager:~/
}

remove_swarm() {

    ssh $SSH_USER@$manager "docker stack rm $STACK_NAME"

    remove_node $kafka
    remove_node $data    
    remove_node $query
    remove_node $producer
    remove_node $manager

    ssh $SSH_USER@$kafka "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$data "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$query "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$producer "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$manager "docker rm \$(docker ps -aq) && docker volume prune"

}

init_swarm() {

    # init manager
    ssh $SSH_USER@$manager "docker swarm init"

    token=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$5}'")
    url=$(ssh $SSH_USER@$manager "docker swarm join-token worker | grep token | awk '{ print \$6}'")

    # init workers
    join_node $kafka $token $url
    join_node $data $token $url    
    join_node $query $token $url
    join_node $producer $token $url

    # add labels
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_manager $node_manager"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_data $node_data"    
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_kafka $node_kafka"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_producer $node_producer"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_query $node_query"

}

add_label() {
    ssh $SSH_USER:$1
}

remove_node() {
    ssh $SSH_USER@$1 "docker swarm leave --force"
}

join_node() {
    ssh $SSH_USER@$1 "docker swarm join --token $2 $3"
}

deploy_stack() {
    ssh $SSH_USER@$manager "docker stack deploy --compose-file $STACK_YML --with-registry-auth $STACK_NAME"
}

provision() {

    # manager
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-manager \
        --instance-type=$EC2_TYPE_MANAGER \
        --ebs-vol-size=60 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # kafka
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-kafka \
        --instance-type=$EC2_TYPE_KAFKA \
        --ebs-vol-size=600 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # data
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-data \
        --instance-type=$EC2_TYPE_DATA \
        --ebs-vol-size=400 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # query
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-query \
        --instance-type=$EC2_TYPE_QUERY \
        --ebs-vol-size=80 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # data-producer
    eyws --profile $AWS_PROFILE create-instances \
        --count=1 \
        --name=druid-data-producer \
        --instance-type=$EC2_TYPE_PRODUCER \
        --ebs-vol-size=40 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP
}

prepare() {

    # copy ssh key
    echo 'copying ssh key to nodes...'
    # copy_ssh_keys

    # install docker
    echo 'installing docker on nodes...'
    # install_docker_on_nodes

    # copy stack.yml
    echo 'copying stack yml...'
    copy_stack

    # copy config
    echo 'copying config files..'
    copy_configs

    # create swarm
    echo 'initializing swarm...'
    init_swarm

    # create network
    echo 'creating network...'
    create_network

    # deploy stack
    echo 'deploying stack...'
    deploy_stack
}

help() {
    echo "Usage setup (wtf|provision|init|remove|help|info)"
    exit
}

create_topics() {

    kafka-topics --create \
        --zookeeper zookeeper:12181 \
        --replication-factor 1 \
        --partitions 3 \
        --topic users

    kafka-topics --create \
        --zookeeper zookeeper:12181 \
        --replication-factor 1 \
        --partitions 3 \
        --topic events
}

if [ $# -lt 1 ]; then
    help
fi

if [ "$1" == "wtf" ]; then    
    wtf
elif [ "$1" == "provision" ]; then
    provision
elif [ "$1" == "init" ]; then
    prepare
elif [ "$1" == "help" ]; then
    help
elif [ "$1" == "info" ]; then
    ssh $SSH_USER@$manager "docker node ls"    
    ssh $SSH_USER@$manager "docker stack services druid-demo"
elif [ "$1" == "remove" ]; then
    remove_swarm
else
    echo "$1 not supported!"
fi


# TODO
# create kafka topics
# initialize superset