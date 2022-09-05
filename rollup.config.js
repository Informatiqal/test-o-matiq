import typescript from "rollup-plugin-typescript2";
import del from "rollup-plugin-delete";
import pkg from "./package.json";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
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
    json(),
    typescript({
      typescript: require("typescript"),
    }),
  ],
};
