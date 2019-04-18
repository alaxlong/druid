#!/bin/bash -eu

if [[ $# -lt 1 ]]; then
  echo "Usage: node.sh nodeType"
  exit 1
fi

nodeType="$1"
shift

exec java \
  $(cat /opt/druid/conf/druid/${nodeType}/jvm.config | xargs) \
  -cp /opt/druid/conf/druid/_common:/opt/druid/conf/druid/${nodeType}:/opt/druid/lib/* \
  -Ddruid.extensions.directory="/opt/druid/extensions" \
  "$@" \
  org.apache.druid.cli.Main \
  server \
  $nodeType
