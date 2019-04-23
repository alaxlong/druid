#!/bin/bash

VERSION_COMPOSE=1.24.0

# install latest docker ce
sudo apt-get update

sudo apt-get install apt-transport-https \
     ca-certificates curlsoftware-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install docker-ce
sudo groupadd docker
sudo usermod -aG docker $USER
sudo systemctl enable docker

# install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/${VERSION_COMPOSE}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

version_dc="docker --version"
version_d="docker-compose --version"

echo $(eval $version_dc)
echo $(eval $version_d)

echo "Go reboot the instance"