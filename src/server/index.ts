//放在最上面可以让express的调试环境变化生效
import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import { SetupApi } from "./api";
import fileUpload from "express-fileupload";
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

SetupApi(app, "/api");
app.get("/", (req: Request, res: Response) => {
  res.send("YAO API测试服务器");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
