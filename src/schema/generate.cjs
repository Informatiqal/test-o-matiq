const tsj = require("ts-json-schema-generator");
const path = require("path");
const fs = require("fs");

const config = {
  path: path.join(__dirname, "../src/interface/Specs.ts"),
  tsconfig: path.join(__dirname, "../../tsconfig.json"),
  type: "Runbook",
};

const schema_path = path.join(__dirname, "./schema.json");

function writeSchema(schema) {
  const schemaString = JSON.stringify(schema, null, 2);
  fs.writeFileSync(schema_path, schemaString);
}

function generateSchema() {
  return tsj.createGenerator(config).createSchema(config.type);
}

function main() {
  const output = generateSchema();

  writeSchema(output);

  console.log(`Schema generated at ${schema_path}`);
}

main();
