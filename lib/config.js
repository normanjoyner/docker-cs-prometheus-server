'use strict';

const myriad = require('./myriad');

const _ = require('lodash');
const async = require('async');

module.exports.generateConfig = function(generateConfigCallback) {
    async.parallel({
        server: getPrometheusServerTargets,
        agent: getPrometheusAgentTargets
    }, (error, results) => {
        if (error) {
            return generateConfigCallback(error);
        }

        let config =
`
global:
    scrape_interval:     ${process.env.PROM_GLOBAL_SCRAPE_INTERVAL || '15s'}
    evaluation_interval: ${process.env.PROM_GLOBAL_EVALUATION_INTERVAL || '15s'}

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 10s
    metrics_path: /metrics
    static_configs:
    - targets: [ ${results.server.hosts.join(',') } ]
`
        ;

        if (results.agent.node.length) {
            config +=
`
  - job_name: 'node'
    scrape_interval: 10s
    metrics_path: /metrics
    static_configs:
    - targets: [ ${results.agent.node.join(',')} ]
`
            ;
        }

        if (results.agent.cadvisor.length) {
            config +=
`
  - job_name: 'cadvisor'
    scrape_interval: 10s
    metrics_path: /metrics
    static_configs:
    - targets: [ ${results.agent.cadvisor.join(',')} ]
`
            ;
        }

        return generateConfigCallback(null, config);
    });
}

function getPrometheusServerTargets(callback) {
    const prometheusConfig = {
        hosts: [ '\'0.0.0.0:9090\'' ]
    };

    myriad.get_application('containership-prometheus', (err, application) => {
        if (err) {
            process.stderr.write(`${err.message}\n`);
            return callback(null, prometheusConfig);
        }

        if (application && application.containers && application.containers.length) {
            const loadedContainers = _.filter(
                    application.containers,
                    container => 'loaded' === container.status
            );

            prometheusConfig.hosts = _.map(loadedContainers, container => {
                const opts = JSON.parse(container.env_vars.CS_PROC_OPTS);

                // Should I get the legiond scope?
                const scope = opts['legiond-scope'];
                const host = opts.legiond.network.address[scope];
                const port = container.env_vars.PROMETHEUS_PORT || 9090;

                return `'${host}:${port}'`;
            });
        }

        return callback(null, prometheusConfig);
    });
}

function getPrometheusAgentTargets(callback) {
    const agentConfig = {
        cadvisor: [],
        node: []
    };

    myriad.get_application('containership-prometheus-agents', (err, application) => {
        if (err) {
            process.stderr.write(`${err.message}\n`);
            return callback(null, agentConfig);
        }

        if (application && application.containers && application.containers.length) {
            _.forEach(application.containers, container => {
                if ('loaded' !== container.status) {
                    return;
                }

                let opts;

                try {
                    opts = JSON.parse(container.env_vars.CS_PROC_OPTS);
                } catch (err) {
                    return;
                }

                const scope = opts['legiond-scope'];
                const host = opts &&
                    opts.legiond &&
                    opts.legiond.network &&
                    opts.legiond.network.address &&
                    opts.legiond.network.address[scope];

                if (!host) {
                    return;
                }

                // cadvisor exporter agent
                const cAdvisorEnabled = container.env_vars.PROM_AGENT_CADVISOR ?
                    'true' === container.env_vars.PROM_AGENT_CADVISOR :
                    true;

                const cAdvisorPort = container.env_vars.PROM_AGENT_CADVISOR_PORT || 8500;

                if (cAdvisorEnabled) {
                    agentConfig.cadvisor.push(`'${host}:${cAdvisorPort}'`);
                }

                // node exporter agent
                const nodeEnabled = container.env_vars.PROM_AGENT_NODE_EXPORTER ?
                    'true' === container.env_vars.PROM_AGENT_NODE_EXPORTER :
                    true;
                const nodePort = container.env_vars.PROM_AGENT_NODE_EXPORTER_PORT || 8501;

                if (nodeEnabled) {
                    agentConfig.node.push(`'${host}:${nodePort}'`);
                }
            });
        }


        return callback(null, agentConfig);
    });
}
