const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
// Two levels up: artifacts/mobile → artifacts → workspace root
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Allow Metro to see all workspace packages (lib/*, artifacts/*)
config.watchFolders = [workspaceRoot];

// Resolve node_modules from the project first, then fall back to workspace root.
// This is required for pnpm monorepos so @workspace/* imports resolve correctly
// both during local dev and when bundled inside the Gradle APK build.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
