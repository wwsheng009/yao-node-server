import { YaoApi } from "@/types/http";
import { log } from "yao-node-client";
import share from "./share";
import * as fs from "fs";
import path from "node:path";

import { Express } from "express";
import { SetupRoutes } from "./routes";

let APIs: { [id: string]: YaoApi.API } = {};

/**
 * 从文件中读取路由配置
 * @param app express实例
 * @param root 根路由
 */
export function ConfigApi(app: Express, root: string) {
  LoadHttpConfigFiles();
  for (const key in APIs) {
    const api = APIs[key];
    SetupRoutes(app, api.http, root, []);
  }
}
/**
 * 从文件中加载设置路由
 */
function LoadHttpConfigFiles() {
  APIs = {};
  if (process.env.YAO_APP_ROOT) {
    let Root = process.env.YAO_APP_ROOT;
    LoadFrom(path.join(Root, "apis"), "");
  }

  //也从本地加载，覆盖远程应用的API
  if (process.env.LOCAL_APP_ROOT) {
    let Root = process.env.LOCAL_APP_ROOT;
    LoadFrom(path.join(Root, "apis"), "");
  } else {
    LoadFrom(path.join("./", "src/app/apis"), "");
  }
}

// Setup();
// LoadFrom 从特定目录加载
function LoadFrom(dir: string, prefix: string) {
  if (!share.DirExists(dir)) {
    let err = `Api config ${dir} does not exists`;
    log.error(err);
    console.log(err);
    return;
  }

  let messages: string[] = [];
  const err = share.Walk(dir, ".http.json", (root: string, fname: string) => {
    const name = prefix + share.SpecName(root, fname);
    const content = share.ReadFile(fname);
    try {
      LoadAPI(content, name, prefix, "bearer-jwt");
    } catch (err) {
      log.error(err.message);
      messages.push(`${name} ${err.message}`);
    }
  });

  if (messages.length > 0) {
    throw new Error(messages.join(";"));
  }

  return err;
}

/**
 * 从文件或是文本中加载API定义
 * @param source api定义文件名或是api定义内容
 * @param id api标识
 * @param guard 守卫
 * @returns
 */
function LoadAPI(
  source: string | Buffer,
  id: string,
  ...guard: string[]
): YaoApi.API {
  let input: any = null;
  if (source.toString().startsWith("file://")) {
    const filename: string = source.toString().replace("file://", "");
    const file: any = fs.openSync(filename, "r");
    if (file === null) {
      throw new Error(`[API] ${id}`);
    }
    fs.closeSync(file);
    input = file;
  } else {
    input = source;
  }

  try {
    let http: YaoApi.HTTP = JSON.parse(input);
    // Filesystem Router
    if (http.group === "") {
      http.group = id.replace(".", "/").toLowerCase();
    }
    // Validate API
    const uniquePathCheck: any = {};
    for (const path of http.paths) {
      const unique: string = `${path.method}.${path.path}`;
      if (uniquePathCheck[unique]) {
        throw new Error(
          `[API] ${id} ${path.method} ${path.path} is already registered`
        );
      }
      uniquePathCheck[unique] = true;
    }

    // Default Guard
    if (http.guard === "" && guard.length > 0) {
      http.guard = guard[0];
    }

    APIs[id] = {
      id: id,
      name: http.name,
      source: source.toString(),
      http: http,
      type: "http",
    };
  } catch (err) {
    throw new Error(`[API] ${id} ${err.message}`);
  }

  return APIs[id];
}
