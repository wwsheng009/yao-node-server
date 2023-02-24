import path from "node:path";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import json from "@rollup/plugin-json";

const __dirname = path.resolve();

// 命令行定义环境变量，在脚本中可以直接获取
// console.log(process.env.TEST);

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/yao-node-server.bound.esm.js",
    sourcemap: true,
    format: "cjs",
  },

  plugins: [
    nodeResolve({ preferBuiltins: true }),
    json(),
    //路径别名
    alias({
      entries: [
        {
          find: "@",
          replacement: path.resolve(__dirname, "src"),
        },
      ],
    }),
    typescript({ module: "commonjs" }),
    commonjs({ include: "node_modules/**" }),
  ],
  external: [], //yao的代理客户端不要打包
};
