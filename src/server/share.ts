import path from "node:path";
import { log } from "yao-node-client";
import * as fs from "fs";

// SpecName 解析名称  root: "/tests/apis"  file: "/tests/apis/foo/bar.http.json"
function SpecName(root: string, file: string): string {
  let filename: string = file.replace(root, ""); // "foo/bar.http.json"
  let namer: string[] = filename.split("."); // ["foo/bar", "http", "json"]
  let nametypes: string[] = namer[0].split(path.sep); // ["foo", "bar"]
  let name: string = nametypes.join("."); // "foo.bar"
  return name;
}

// DirNotExists 校验目录是否存在
function DirExists(dir: string): boolean {
  dir = dir.replace(/^fs:\/\//, "");
  dir = dir.replace(/^file:\/\//, "");
  return fs.existsSync(dir);
  // try {
  //   const stats = fs.lstatSync(dir);
  //   return false;
  // } catch (err) {
  //   return true;
  // }
}

// Walk 遍历应用目录，读取文件列表
function Walk(
  root: string,
  typeName: string,
  cb: (root: string, fname: string) => void
): void {
  root = root.replace("fs://", "");
  root = root.replace("file://", "");
  root = path.join(path.resolve(root), path.sep);
  walk(root, (filename: string, info: fs.Stats, err: Error) => {
    if (err) {
      log.error(err.message, { root, type: typeName, filename });
      return err;
    }
    if (filename.endsWith(typeName)) {
      cb(root, filename);
    }
    return null;
  });
}

function walk(
  dir: string,
  cb: (filename: string, info: fs.Stats, err: Error) => void
) {
  let getFile = (d: string) => {
    try {
      const files = fs.readdirSync(d);
      files.forEach(function (file: string) {
        const filePath = path.join(d, file); // d + "/" + file;
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory()) {
          getFile(filePath);
        } else {
          // filesall.push(filePath);
          cb(filePath, fileStat, null);
        }
      });
    } catch (error) {
      cb(null, null, error);
    }
  };
  getFile(dir);
}

// ReadFile 读取文件
function ReadFile(filename: string): Buffer {
  const file = fs.openSync(filename, "r");
  const content = fs.readFileSync(file);
  fs.closeSync(file);
  return content;
}

export default { DirExists, ReadFile, SpecName, Walk };
