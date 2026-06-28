const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const targets = [
  path.join(root, "backend", "src"),
  path.join(root, "frontend", "scripts"),
  path.join(root, "scripts"),
  path.join(root, "test")
];

function collectJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = targets.flatMap(collectJavaScriptFiles);

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  new vm.Script(source, { filename: file });
}

process.stdout.write(`Syntax OK: ${files.length} files checked.\n`);
