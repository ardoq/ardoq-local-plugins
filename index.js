#!/usr/bin/env node
'use strict';

var PluginUpdater = require('./plugin_updater.js'),
  fs = require('fs'),
  _ = require('lodash');

var cwd = process.cwd(),
  config = require(cwd + '/config.json'),
  pluginPath = cwd + '/' + config.pluginPath;

var updater = new PluginUpdater(config);

fs.watchFile(pluginPath, {
  interval: 2000
}, (curr, prev) => {
  if (!_.isEqual(curr, prev)) {
    console.log('Detected changes (' + pluginPath + ')');
    updater.push();
  }
});