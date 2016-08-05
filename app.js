'use strict';

const configUtil = require('./lib/config');

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

const prometheusExecPath = path.resolve(
        __dirname,
        process.env.PROMETHEUS_FILE,
        'prometheus'
);

const prometheusConfigPath = path.resolve(__dirname, 'cs.prometheus.yml');
const baseTemplatePath = path.resolve(__dirname, 'templates', 'base.template');

configUtil.generateConfig((err, config) => {
    if (err) {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
    }

    fs.writeFileSync(prometheusConfigPath, config);

    const prometheus = spawn(prometheusExecPath, [
                '-config.file',
                prometheusConfigPath,
                '-web.listen-address',
                `0.0.0.0:${+process.env.PROMETHEUS_PORT || 9090}`,
                '-storage.local.memory-chunks',
				`${+process.env.PROM_MEMORY_CHUNKS || 1048576}`,
                '-storage.local.path',
                `${process.env.PROM_STORAGE_PATH || '/opt/containership/metrics/data'}`
    ]);

    prometheus.stdout.on('data', (data) => {
        process.stdout.write(data);
    });

    prometheus.stderr.on('data', (data) => {
        process.stderr.write(data);
    });

    prometheus.on('close', (code) => process.exit(code));

    setInterval(() => {
        configUtil.generateConfig((err, config) => {
            if (err) {
                process.stderr.write(`${err.message}\n`);
                return;
            }

            fs.writeFileSync(prometheusConfigPath, config);
            prometheus.kill('SIGHUP');
        });
    }, +process.env.PROM_REFRESH_INTERVAL || 15000);
});
