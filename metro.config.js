const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname; // /Users/saudceo/flick-frontend/vite-project/scene-app
const sharedRoot = path.resolve(projectRoot, "../../shared"); 
// two levels up from scene-app to reach /flick-frontend/shared


const config = getDefaultConfig(projectRoot);

// Watch the shared folder
config.watchFolders = [sharedRoot];

// Resolve dependencies from app's node_modules
config.resolver.extraNodeModules = new Proxy({}, {
  get: (_, name) => path.join(projectRoot, `node_modules/${name}`)
});

// Include .js and .jsx
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), "js", "jsx", "json"])
);

module.exports = config;
