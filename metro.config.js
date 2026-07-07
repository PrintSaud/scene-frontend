const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  shared: path.resolve(projectRoot, "shared"),
};

config.watchFolders = [
  path.resolve(projectRoot, "shared"),
  path.resolve(projectRoot, "vite-project/scene-app"),
];

module.exports = config;
