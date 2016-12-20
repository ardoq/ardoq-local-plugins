# ardoq-local-plugins

A utility for developing plugins locally by syncing your updates with the Ardoq API.

### Dependencies
- [NPM](https://www.npmjs.com/) and [Node](https://nodejs.org)
- Access to an [Ardoq](https://ardoq.com/) organization with plugin development

### Setup (from your working directory)
1. Installation: `npm install ardoq-local-plugins`

2. Create a local version of the plugin, i.e. "plugin.js"

3. Create a config file "config.json":
```javascript
{
  "api": "https://app.ardoq.com/api/",
  "apiToken": "YOUR-API-TOKEN", // Your API token (created in your Ardoq account settings)
  "org": "YOUR-ORG-KEY", // Found with your API token
  "pluginPath": "plugin.js", // Path to your local version of the plugin
  "pluginData": "plugin.json" // Holds your local version of the plugin, will be created automatically
}
```

### Usage (from your working directory)

```shell
# Run:
./node_modules/.bin/ardoq-local-plugins

? -- Choose a plugin for local development --
  1) Hello (id: pluginidz)
  2) Your plugin name (id: pluginidsss)
  3) multibar (id: multibar)
  Answer: 1

Warning: Local plugin code differs from the remote version!
? -- Choose which file to keep (other will be backed up) --
  1) Remote
  2) Local
  Answer: 1

Overwrote local with remote version.
Detected changes (/Users/anton164/.Trash/sample-plugin2/plugin.js)
Successfully updated the plugin.
Waiting for changes...
Synced local plugin data from remote:
All up-to-date.
Detected changes (/Users/anton164/.Trash/sample-plugin2/plugin.js)
Successfully updated the plugin.
Waiting for changes...
```

Now you have successfully synced the plugin to the remote and you can start developing locally!
When you're developing locally, run:   
`./node_modules/.bin/ardoq-local-plugins`  
to continually update the remote version of the plugin upon local changes.

