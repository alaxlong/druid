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

CONF='./conf'
AWS_SECRETS='./aws'

S3_ACCESS_KEYS=aws-s3-access

# todo : fetch these
manager="ec2-18-197-155-111.eu-central-1.compute.amazonaws.com"
kafka1="ec2-18-197-143-106.eu-central-1.compute.amazonaws.com"
# kafka2="ec2-18-185-34-19.eu-central-1.compute.amazonaws.com"
data1="ec2-18-185-116-28.eu-central-1.compute.amazonaws.com"
data2="ec2-3-121-202-154.eu-central-1.compute.amazonaws.com"
query="ec2-3-120-229-217.eu-central-1.compute.amazonaws.com"
producer="ec2-52-58-255-196.eu-central-1.compute.amazonaws.com"

# todo : fetch these
node_manager="ip-172-31-35-99"
node_kafka_1="ip-172-31-42-142"
# node_kafka_2="ip-172-31-43-21"
node_data_1="ip-172-31-36-110"
node_data_2="ip-172-31-45-225"
node_query="ip-172-31-46-239"
node_producer="ip-172-31-37-208"

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
    1 x $EC2_TYPE_KAFKA for KAFKA (kafka, zookeeper)  => $ 5.02 per day
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
    copy_ssh_key $kafka1
    # copy_ssh_key $kafka2
    copy_ssh_key $data1
    copy_ssh_key $data2
    copy_ssh_key $query
    copy_ssh_key $producer
}

install_docker_on_nodes() {
    install_docker $manager
    install_docker $kafka1
    # install_docker $kafka2
    install_docker $data1
    install_docker $data2
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

    cat $S3_ACCESS_KEYS >>$CONF/druid/_common/common.runtime.properties

    copy_config event-ingestion-spec.json $manager

    copy_config_to_all $CONF
    copy_config_to_all $AWS_SECRETS

}

copy_config_to_all() {
    copy_config $1 $manager
    copy_config $1 $kafka1
    # copy_config $1 $kafka2
    copy_config $1 $data1
    copy_config $1 $data2
    copy_config $1 $query
    copy_config $1 $producer
}

copy_config() {
    scp -rp $1 $SSH_USER@$2:~/
}

copy_stack() {
    scp -p $STACK_YML $SSH_USER@$manager:~/
}

remove_swarm() {

    ssh $SSH_USER@$manager "docker stack rm $STACK_NAME"

    remove_node $kafka1
    # remove_node $kafka2
    remove_node $data1
    remove_node $data2
    remove_node $query
    remove_node $producer
    remove_node $manager

    ssh $SSH_USER@$kafka1 "docker rm \$(docker ps -aq) && docker volume prune"
    # ssh $SSH_USER@$kafka2 "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$data1 "docker rm \$(docker ps -aq) && docker volume prune"
    ssh $SSH_USER@$data2 "docker rm \$(docker ps -aq) && docker volume prune"
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
    join_node $kafka1 $token $url
    # join_node $kafka2 $token $url
    join_node $data1 $token $url
    join_node $data2 $token $url
    join_node $query $token $url
    join_node $producer $token $url

    # add labels
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_manager $node_manager"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_data $node_data_1"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_data $node_data_2"
    ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_kafka $node_kafka_1"
    # ssh $SSH_USER@$manager "docker node update --label-add node.type=$node_type_kafka $node_kafka_2"
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

login_docker_hub() {
    ssh $SSH_USER@$manager "docker login --password-stdin -u canelmas"
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
        --ebs-vol-size=100 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # kafka
    eyws --profile $AWS_PROFILE create-instances \
        --count=2 \
        --name=druid-kafka \
        --instance-type=$EC2_TYPE_KAFKA \
        --ebs-vol-size=500 \
        --key-pair=$KEY_PAIR \
        --sec-group=$SEC_GROUP

    # data
    eyws --profile $AWS_PROFILE create-instances \
        --count=2 \
        --name=druid-data \
        --instance-type=$EC2_TYPE_DATA \
        --ebs-vol-size=500 \
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
        --ebs-vol-size=50 \
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

    # docker login
    echo 'login docker registry..'
    # login_docker_hub

    # deploy stack
    echo 'deploying stack...'
    deploy_stack
}

help() {
    echo "Usage setup (wtf|provision|init|remove|help|info)"
    exit
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
# set automatically ec2 dns and private ips
# create kafka topics
# initialize superset # docker exec -it be0684a3bfc1 superset-init
# start connect
