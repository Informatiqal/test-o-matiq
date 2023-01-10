import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import { readFileSync } from "fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const pkg = JSON.parse(readFileSync("./package.json"));

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.module,
      format: "es",
      name: "TesOMatiq",
      sourcemap: true,
      globals: {
        // ajv: "Ajv",
        events: "events",
      },
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "events",
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    nodeResolve(),
    json(),
    typescript(),
  ],
};
