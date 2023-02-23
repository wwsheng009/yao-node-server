//放在最上面可以让express的调试环境变化生效
import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import { ConfigApi } from "./api";
import fileUpload from "express-fileupload";
import path from "node:path";
import fs from "fs";

import listEndpoints from "express-list-endpoints";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded()); //Parse URL-encoded bodies
app.use(express.raw());
app.use(express.text());
app.use(
  fileUpload({
    createParentPath: true,
  })
);

const port = parseInt(process.env.PORT);

ConfigApi(app, "/api");
// app.get("/", (req: Request, res: Response) => {
//   res.send("YAO API测试服务器");
// });

let pub = "public";
if (typeof process.env.YAO_APP_ROOT === "string") {
  let p1 = path.join(path.resolve(process.env.YAO_APP_ROOT), "public");
  if (fs.existsSync(p1)) {
    pub = p1;
  }
}
app.use(express.static(pub));

//打印所有路由
console.log(listEndpoints(app));

app.listen(port, "0.0.0.0", () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
