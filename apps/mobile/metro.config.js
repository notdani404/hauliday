// Metro config for the pnpm monorepo. Watches the workspace root so the
// @hauliday/* packages resolve, and pins module resolution to the app + root
// node_modules (pnpm hoisted). Per Expo's monorepo guide.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
