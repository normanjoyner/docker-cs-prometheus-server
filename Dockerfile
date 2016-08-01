FROM mhart/alpine-node:6.3.0

MAINTAINER ContainerShip Developers <developers@containership.io>

ENV PROMETHEUS_HOME=/opt/prometheus
ENV PROMETHEUS_VERSION=0.20.0
ENV PROMETHEUS_FILE=prometheus-$PROMETHEUS_VERSION.linux-amd64
ENV PROMETHEUS_PORT=9090
ENV PROM_MEMORY_CHUNKS=1048576
ENV PROM_STORAGE_PATH=/mnt/containership/metrics/data
ENV PROM_REFRESH_INTERVAL=15000
ENV PROM_GLOBAL_SCRAPE_INTERVAL=15s
ENV PROM_GLOBAL_EVALUATION_INTERVAL=15s

WORKDIR $PROMETHEUS_HOME
COPY . .

RUN npm install

RUN apk add --update --no-cache curl

RUN curl -L https://github.com/prometheus/prometheus/releases/download/$PROMETHEUS_VERSION/$PROMETHEUS_FILE.tar.gz | tar -xvz
RUN ls $PROMETHEUS_FILE

CMD node app.js
