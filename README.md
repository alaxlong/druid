just playing around

## Druid

### Overview

- Each druid process type can be configured and scaled independently

- Druid Processes:
    
    * **Historical** : Handle storage and querying on "historical" data (including data that has been in the system long enough to be committed)

        Historical processes download segments from deep storage and respond to queries about these segments
    
    * **MiddleManage** : Handle ingestion of new data. Responsible for reading from external data sources and publishing new Druid segments

    * **Broker** : Receive queries from external clients and forward those queries to Historicals and MiddleManagers. End users typically query Brokers rather than querying Historicals and MiddleManagers directly

    * **Coordinator** : Watch over historical processes. Responsible for assigning segments to specific servers, and for ensuring segments are well-balanced across Historicals

    * **Overlord** : Watch over Middlemanager. They are the controllers of data ingestion into Druid. Responsible for assigning ingestion tasks to MiddleManages and for coordinating segment publishing.

    * **Router** : Optional processes that provide a unified API gateway in front of Druid Brokers, Overlords

- "Three-Type Plan"
    * **Data Servers** run Historical and MiddleManager processes
    * **Query Servers** run Broker and (optionally) Router processes
    * **Master Servers** run Coordinator and Overlord processes. They may run Zookeeper as well

- External Dependencies:
    * **Deep Storage** : Shared file storage accessible by Every Druid server. Druid uses this to store any data that has been ingested into the system. e.g. S3 or HDFS

        Druid uses deep storage as a backup of your data. 

        To respond to queries, Historical processes do not read from deep storage, but instead read pre-fetched segments from their local disks before any queries are served.

        **This means that Druid never needs to access deep storage during a query. This also means that you must have enough disk space both in deep storage and across your Historical processes for the data you plan to load.**
        

    * **Metadata Store** : Shared metadata storage. e.g. Postgre or MySQL

    * **Zookeeper** : Used for internal service discovery, coordination and leader selection.

- Architecture :

    ![Architecture](http://druid.io/docs/img/druid-architecture.png)

### Datasources and Segments

- Druid data is stored in **datasources**

- Each datasource is partitioned by time and optionally further partitioned by other attributes.

- Each time range is called **chunk** (e.g. a single day)

- Within a chunk, data is partitioned into one or more **segments**

- *Segment building process:
    * Conversion to columnar format
    * Indexing with bitmap indexes
    * Compression using various algorithms

- Periodically, segments are committed and published. At this point, they are written on deep storage, become immutable, and move from MiddleManagers to the Historical processes.

- An entry about the segment, including things like the schema of the segment, its size, and its location on deep storage. These entries are what the Coordinator uses to know what data should be available on the cluster.
