const path = require("path");
const fs = require("fs");
const { getRoutes } = require("./node_modules/expo-router/build/getRoutes");
const root = path.resolve("src/app");
const files = [];
function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      const rel = "./" + path.relative(root, full).replace(/\\/g, "/");
      files.push(rel);
    }
  }
}
walk(root);
const context = {
  keys: () => files,
  resolve: (key) => key,
  require: (key) => ({}),
};
const routes = getRoutes(context, { ignoreRequireErrors: true });
console.log(JSON.stringify(routes, null, 2));
