# Connect Data Generator

## Usage
## ToDo


## Redis
```bash
FLUSHALL
SCAN
redis-cli --scan --pattern "*" | wc -l
```


```
bash

eyws create-instances --profile commencis-poc -t c5.4xlarge -c 2 -n data-producer -r eu-central-1 -z eu-central-1b -s bigdatapoc --ebs-delete=false -e 40 -k bigdatapoc

sudo apt install redis-tools
```
