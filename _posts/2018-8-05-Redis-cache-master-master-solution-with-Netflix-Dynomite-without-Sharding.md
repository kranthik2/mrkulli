---
layout: post
title: Redis cache master-master solution with Netflix Dynomite without Sharding
categories: [netflix, dynomite, redis, cache]
tags: [netflix, dynomite, redis, cache]
background: '/static/img/posts/dynomite.png'
---

<p> This article discusses about how to run Dynomite as docker container and offers solution for Non-Sharding and multi master replication. Sharing lessons learned while setting up multi master cache solution, so you do not hit the same pitfalls. Sharding is mainly for very large scale applications, with lots of data and adds additional programming and operational complexity to application. If your application uses couple of GB’s memory and bound by read/write performance, you do not need Sharding. </p>

<p>Dynomite is the great product that offers multi master cache solution. Dynomite cluster consists of multiple data centers. A datacenter is a group of racks and rack is a group of nodes. Each rack consists of the entire dataset, which is partitioned across multiple nodes in that rack. Each node in a rack has a unique token, which helps to identify which dataset it owns.</p>

<img src="https://raw.githubusercontent.com/kranthik2/mrkulli/master/img/posts/dynomite-architecture.png"/>
                      
<p>To make dynomite node contain all the data set you need to use the same token (example ‘0’) for all the nodes, So every node in the cluster will have the complete data set and make sure to use simple provider as seed provider. If you use “florida_provider”, each dynomite node will periodically reach out to a dynomite-manager (side car) rest service to obtain the cluster members, see membership protocols for how membership protocol works. You do not need to run docker with -g gossip flag (dynomite wiki document is not up to date). </p>

<p>
Below is the sample dynomite.yml file for 4-node cluster with two nodes in two data centers and single node in a rack to replicate total data set to ALL nodes : </p>

{% highlight yaml %}
dyn_o_mite:
  datacenter: dc1
  rack: rack1
  dyn_listen: 0.0.0.0:8103
  dyn_seed_provider: simple_provider
  dyn_seeds:
    - 149.191.72.64:8103:dc1:rack2:0
    - 149.191.72.65:8103:dc2:rack1:0
    - 149.191.72.66:8103:dc2:rack2:0
  listen: 0.0.0.0:8102
  servers:
    - 127.0.0.1:22122:1
  preconnect: false
  server_retry_timeout: 30000
  timeout: 10000
  server_failure_limit: 20
  tokens: '0'
  pem_key_file: /apps/dynomite/conf/dynomite.pem
  data_store: 0
  stats_listen: 0.0.0.0:22222
  secure_server_option: none
  read_consistency: DC_QUORUM
  write_consistency: DC_QUORUM
  
{% endhighlight %}

<p>
Above configuration uses DC_QUORUM consistency, that means reads and writes are propagated synchronously to quorum number of nodes in the local data center and asynchronously to the rest. Consistency is runtime configurable and can be separately configurable for read and writes. Dynomite communicates with other nodes for replication through peer port, 8103 in this case, make sure port is open between nodes for communication.
</p>

<p>
Update conf/redis_single.yml with updated dynomite.yml or update the <a href="https://github.com/Netflix/dynomite/blob/dev/docker/scripts/startup.sh">statup script </a>  with updated dynomite.yml name. </p>

</p>
Git clone dynomite, docker build and run container. </p>

{% highlight shell %}
git clone -b dev https://github.com/Netflix/dynomite.git
cd dynomite/docker
docker build -t dynomite_poc .
docker run -name dynomite_poc_instance -i -i dynomite_poc
{% endhighlight %}
