const { spawn } = require("child_process");

const args = process.argv.slice(2);
const env = { ...process.env };

if (process.env.REPL_ID) {
  // Replit-specific environment variable setup
  env.EXPO_PACKAGER_PROXY_URL = `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`;
  env.EXPO_PUBLIC_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
  env.EXPO_PUBLIC_REPL_ID = process.env.REPL_ID;
  env.REACT_NATIVE_PACKAGER_HOSTNAME = process.env.REPLIT_DEV_DOMAIN;

  const port = process.env.PORT || "8081";
  
  // Prepend default arguments for Replit
  args.unshift("start", "--localhost", "--port", port);
} else {
  // Local development
  args.unshift("start");
}

const child = spawn("pnpm", ["exec", "expo", ...args], {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
