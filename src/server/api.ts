import { YaoApi } from "@/types/http";
import { log, Process } from "yao-node-client";
import share from "./share";
import * as fs from "fs";
import path from "node:path";
import os from "os";

import express, { Express, Request, Response, Router } from "express";
import { URLToQueryParam } from "./query_param";
import { UploadedFile } from "express-fileupload";

let APIs: { [id: string]: YaoApi.API } = {};

// LoadFrom 从特定目录加载
function LoadFrom(dir: string, prefix: string) {
  if (!share.DirExists(dir)) {
    throw new Error(`${dir} does not exists`);
  }

  let messages: string[] = [];
  const err = share.Walk(dir, ".http.json", (root: string, fname: string) => {
    const name = prefix + share.SpecName(root, fname);
    const content = share.ReadFile(fname);
    try {
      LoadAPIReturn(content, name, "bearer-jwt");
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

function LoadAPIReturn(
  source: string | Buffer,
  id: string,
  ...guard: string[]
) {
  return LoadAPI(source, id, ...guard);
}

// LoadAPI 加载API
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

export function GetApis() {
  return APIs;
}
if (process.env.YAO_APP_ROOT) {
  let Root = process.env.YAO_APP_ROOT;
  LoadFrom(path.join(Root, "apis"), "");
  // console.log(APIs);
}

export function SetupApi(app: Express, root: string) {
  for (const key in APIs) {
    const api = APIs[key];
    routes(app, api.http, root, []);
  }
}

// Routes 配置转换为路由
function routes(
  app: Express,
  http: YaoApi.HTTP,
  root: string,
  allows: string[]
) {
  let group: any = router;
  if (http.group !== "") {
    root = path.join(root, "/", http.group);
  }
  //   group = router.group(root);
  var router = express.Router();

  for (const path of http.paths) {
    path.method = path.method.toUpperCase();
    route(app, http, router, path, allows);
  }
  app.use(root, router);
}

function route(
  app: Express,
  http: YaoApi.HTTP,
  router: Router,
  upath: YaoApi.Path,
  allows: string[]
) {
  //@ts-ignore
  router[upath.method.toLowerCase()](
    upath.path,
    (req: Request, res: Response) => {
      let resp = null;

      let get = input(upath);
      const args = get({ req, res });
      // console.log("request arguments;\r\n", args);
      resp = Process(upath.process, ...args);
      const status = upath.out.status;
      const contentType = upath.out.type;
      if (contentType != "") {
        res.setHeader("Content-Type", contentType);
      }
      if (upath.out.headers && Object.keys(upath.out.headers).length) {
        if (resp instanceof Object) {
          let data = share.Dot(resp);
          for (const name in upath.out.headers) {
            const value = upath.out.headers[name];
            let v = share.Bind(value, data);
            if (v) {
              res.setHeader(name, v);
            }
          }
        } else {
          for (const key in upath.out.headers) {
            const element = upath.out.headers[key];
            res.setHeader(key, element);
          }
        }
      }

      // Redirect
      if (upath.out.redirect) {
        let code = upath.out.redirect.code;
        if (code == 0) {
          code = 301;
        }
        res.redirect(code, upath.out.redirect.location);
      }
      if (!resp) {
        return;
      }
      let body = resp;
      if (upath.out.body) {
        if (body instanceof Object) {
          let data = share.Dot(resp);
          body = share.Bind(upath.out.body, data);
        }
      }
      if (body instanceof Object) {
        res.json(body);
      } else {
        if (contentType == "application/json") {
          res.status(status);
          res.json(body);
        } else {
          res.status(status);
          res.send(body);
        }
      }
    }
  );
}

type Context = {
  req: Request;
  res: Response;
};
type In = {
  handler: (context: Context, name: string) => any;
  varname: string;
};
function input(path: YaoApi.Path): (c: Context) => any[] {
  const gets: In[] = [];
  for (const in1 of path.in) {
    const inStr = in1 as string;
    if (inStr) {
      const args = inStr.split("."); // [":query"] ["$query", "name"]
      const vartype = args[0]; // :query, $query
      let varname = args[0].substring(1); // query, name
      if (args.length > 1) {
        varname = args.slice(1).join(".");
      }

      const get = getHandlers[vartype];
      if (get) {
        gets.push({ handler: get, varname });
        continue;
      }
    }
    // Default var
    gets.push({ handler: (c: Context, name: string) => in1, varname: "" });
  }

  return (c: Context) => {
    const values: any[] = [];
    for (const inx of gets) {
      values.push(inx.handler(c, inx.varname));
    }
    return values;
  };
}

const getHandlers: { [key: string]: (c: Context, name: string) => any } = {
  ":body": (c: Context, name: string): any => {
    let bytes = c.req.body;
    if (!bytes) {
      throw Error(`can't read :body data.`);
    }

    return String(bytes);
  },
  ":payload": (c: Context, name: string): any => {
    const value = c.req.body;
    if (!value) {
      return {};
    }
    return value;
  },
  ":param": (c: Context, name: string): any => {
    return c.req.params;
  },
  ":fullpath": (c: Context, name: string): any => c.req.originalUrl,
  ":header": (c: Context, name: string): any => c.req.headers,
  ":query": (c: Context, name: string): any => c.req.query,
  ":form": (c: Context, name: string): any => c.req.body,
  ":params": (c: Context, name: string): any =>
    URLToQueryParam(c.req.query as { [key: string]: string }),
  ":query-param": (c: Context, name: string): any =>
    URLToQueryParam(c.req.query as { [key: string]: string }),
  ":context": (c: Context, name: string): any => c,
  $query: (c: Context, name: string): any => c.req.query[name],
  $payload: (c: Context, name: string): any => {
    return c.req.body[name];
  },
  $form: (c: Context, name: string): any => c.req.body[name],
  $param: (c: Context, name: string): any => c.req.params[name],
  // "$session": (c: Context, name: string): any => {
  // 	const sid = c.GetString("__sid");
  // 	if (sid !== "") {
  // 		return session.Global().ID(sid).MustGet(name);
  // 	}
  // 	return null;
  // },
  $file: (c: Context, name: string): any => {
    if (!c.req.files) {
      return c.res.status(500).send("No files were uploaded.");
    }
    let file_upload = c.req.files[name] as UploadedFile;
    if (!file_upload) {
      return c.res.status(500).send(`No files were found for ${name}.`);
    }
    // 	let file;
    // 	try {
    // 		file = c.FormFile(name);
    // 	} catch (err) {
    // 		throw exception.New("Can't read upload file %s", 500, err);
    // 	}
    let fname = file_upload.name;
    // const ext = path.extname(fname);
    let dir;
    try {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), `upload-`));
      // dir = ioutil.TempDir(os.TempDir(), "upload");
    } catch (err) {
      return c.res.status(500).send(`Can't create temp dir ${err}`);
    }
    let tmpfile;
    try {
      tmpfile = path.join(dir, fname);
    } catch (err) {
      return c.res.status(500).send(`Can't create temp file ${err}`);
    }
    try {
      const f1 = fs.openSync(tmpfile, "w");
      fs.writeFileSync(f1, file_upload.data);
      fs.closeSync(f1);
    } catch (err) {
      c.res.status(500);
      return c.res.status(500).send(`Can't save temp file ${err}`);
    }
    return {
      Name: fname,
      TempFile: tmpfile,
      Size: file_upload.size,
      Header: c.req.header,
    };
  },
};
