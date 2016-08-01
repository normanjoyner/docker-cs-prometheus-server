# docker-cs-prometheus
containership promethius docker image

## Installation
```
sudo docker run \
         --net=host \
         --detach=true \
         --name=containership-prometheus \
         containership/docker-cs-prometheus:latest
```

## Environment Variables

`PROMETHEUS_VERSION` - version of prometheus to run in the container (default: 0.20.0)

`PROMETHEUS_PORT` - port for prometheus to run on (default:9090)

`PROM_REFRESH_INTERVAL` - refresh interval for prometheus to reload its configuration (default:15000, unit: ms)

`PROM_GLOBAL_SCRAPE_INTERVAL` - global default interval for prometheus to scrape metrics from agents (default:15s)

`PROM_GLOBAL_EVALUATION_INTERVAL` - global default interval for prometheus to evaluation rules (default:15s)

`PROM_STORAGE_PATH` - default local storage path for prometheus to store metric data (default:/mnt/containership/metrics/data)

`PROM_MEMORY_CHUNKS` - The number of most recently used chunks for prometheus to keep in memory. Each chunk is 1024 bytes, so base the number of chunks on the amount of RAM provided to the container. Prometheus suggests: As a rule of thumb, you should have at least three times more RAM available than needed by the memory chunks alone. (default: 1048576, unit: chunks)

## Roadmap

* Mount a standardized containership data volume into container so prometheus can load previous data on relaunch in same instance
* Gracefully recover and coordinate with other prometheus servers running on a containership cluster
* Add support to dynamically load custom scraper targets
* Add support to point at containership applications and specify as scraper targets
