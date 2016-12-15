var fs = require('fs'),
  cwd = process.cwd(),
  unirest = require('unirest'),
  _ = require('lodash'),
  inquirer = require('inquirer');

const API_GENERATED_FIELDS = ['last-updated', 'last-modified-by'];

class PluginUpdater {
  constructor (config) {
    var that = this;
    this.config = config;
    this.pluginPath = cwd + '/' + config.pluginPath;
    this.pluginDataPath = cwd + '/' + config.pluginData;

    this.headers = {
      'Authorization': 'Token token=' + config.apiToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    this.initPluginData();
  }

  initPluginData () {
    try {
      this.pluginData = require(this.pluginDataPath);
    } catch (e) {
      this.pluginData = {};
    }
    if (this.pluginData._id) {
      this.updatePluginData();
    } else {
      this.selectOrCreatePlugin();
    }
  }

  selectOrCreatePlugin () {
    var that = this;

    unirest.get(this.config.api + 'plugin?org=' + this.config.org)
      .headers(this.headers)
      .end(function (response) {
        if (response.statusCode === 200) {
          var plugins = response.body;
          var choices = plugins.map(function (plugin) {
            return {
              name: plugin.name + ' (id: ' + plugin.id + ')',
              value: plugin._id
            };
          });
          // choices.push(new inquirer.Separator());
          // choices.push({
          //   name: 'Create a new plugin (currently not supported)',
          //   value: 'new'
          // });

          inquirer.prompt([{
            type: 'rawlist',
            name: 'pluginChoice',
            message: '-- Choose a plugin for local development --',
            choices: choices
          }]).then(function (data) {
            if (data.pluginChoice === 'new') {
              console.log('To-do: create a new plugin');
            } else {
              that.pluginData = {
                _id: data.pluginChoice
              };
              that.updatePluginData();
            }
          });
        } else {
          console.warn('Couldn\'t get existing plugins', response.statusCode);
        }
      });
  }

  updatePluginData () {
    var that = this;

    unirest.get(this.config.api + 'plugin/' + this.pluginData._id + '?org=' + this.config.org)
      .headers(this.headers)
      .end(function (response) {
        if (response.statusCode === 200) {
          var remotePluginData = response.body;
          var localPlugin = fs.readFileSync(that.pluginPath).toString('utf8');

          if (remotePluginData.script !== localPlugin) {
            var backupPath = cwd + '/backup-';
            console.warn('Warning: Local plugin code differs from the remote version!');
            inquirer.prompt([{
              type: 'rawlist',
              name: 'overwriteChoice',
              message: '-- Choose which file to keep (other will be backed up) --',
              choices: ['Remote', 'Local']
            }]).then(function (data) {
              if (data.overwriteChoice === 'Local') {
                backupPath += 'local-' + Date.now() + '.js';
                fs.writeFile(backupPath, localPlugin, 'utf8');
                fs.writeFile(that.pluginPath, remotePluginData.script, 'utf8');
              } else {
                backupPath += 'remote-' + Date.now() + '.js';
                fs.writeFile(backupPath, remotePluginData.script, 'utf8');
                // Overwrite to force a push
                fs.writeFile(that.pluginPath, localPlugin, 'utf8');
              }
            });
          }

          var mergedPluginData = {},
            changes = 0;
          _.each(remotePluginData, function (remoteVal, key) {
            if (API_GENERATED_FIELDS.indexOf(key) !== -1) {
              return;
            } else if (!that.pluginData[key]) {
              mergedPluginData[key] = remoteVal;
            } else if (that.pluginData[key] !== remoteVal) {
              changes++;
              mergedPluginData[key] = remoteVal;
            } else {
              mergedPluginData[key] = remoteVal;
            }
          });
          that.pluginData = mergedPluginData;
          that.writeLocalPluginData();
          console.log('Synced local plugin data from remote:');
          if (changes === 0) {
            console.log('All up-to-date.')
          } else {
            console.log('Forced updates to ' + that.pluginDataPath);
          }
        } else {
          console.warn('Couldn\'t get remote plugin', response.statusCode);
        }
      });
  }

  writeLocalPluginData () {
    fs.writeFile(this.pluginDataPath, JSON.stringify(this.pluginData, null, 4), 'utf8');
  }

  push () {
    var that = this;
    this.pluginData.script = fs.readFileSync(this.pluginPath).toString('utf8');
    this.pluginData.content = 'define("plugin/' + this.pluginData.id + '", [], function(){ return ' + this.pluginData.script + '});';
    unirest.put(this.config.api + 'plugin/' + this.pluginData._id + '?org=' + this.config.org)
      .headers(this.headers)
      .send(this.pluginData)
      .end(function (response) {
        if (response.statusCode === 200) {
          console.log('Successfully updated the plugin.');
          that.pluginData._version += 1;
          that.writeLocalPluginData();
        } else if (response.statusCode === 409) {
          console.warn('Local version differs from remote version', response.statusCode);
        } else {
          console.warn('Couldn\'t update the plugin', response.statusCode);
        }
      });
  }
}

module.exports = PluginUpdater;