FROM openjdk:8-jre

LABEL maintainer="Can Elmas <canelm@gmail.com>"

ENV DRUID_HOME=/opt/druid

ARG DRUID_VERSION=0.14.0

# druid
RUN curl -O http://ftp.itu.edu.tr/Mirror/Apache/incubator/druid/${DRUID_VERSION}-incubating/apache-druid-${DRUID_VERSION}-incubating-bin.tar.gz \
    && tar xzf apache-druid-${DRUID_VERSION}-incubating-bin.tar.gz \ 
    && mkdir -p ${DRUID_HOME} \
    && mv apache-druid-${DRUID_VERSION}-incubating druid \
    && mv druid /opt    

# mysql connector
RUN curl -O http://central.maven.org/maven2/mysql/mysql-connector-java/5.1.38/mysql-connector-java-5.1.38.jar \
    && mv mysql-connector-java-5.1.38.jar ${DRUID_HOME}/extensions/mysql-metadata-storage

COPY start.sh ${DRUID_HOME}/bin/start.sh

RUN mkdir -p ${DRUID_HOME}/var/tmp

VOLUME ${DRUID_HOME}/var

WORKDIR $DRUID_HOME

EXPOSE 8081-8083 8888 8090

ENTRYPOINT ["bin/start.sh"]