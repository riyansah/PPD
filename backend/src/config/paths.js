const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..", "..");

function resolveFromRoot(...segments) {
  return path.resolve(projectRoot, ...segments);
}

module.exports = {
  projectRoot,
  resolveFromRoot
};
