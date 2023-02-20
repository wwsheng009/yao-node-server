import * as fs from "fs";
import path from "node:path";

function getFiles(dir: string) {
  let filesall = [] as string[];

  let getFile = (d: string) => {
    const files = fs.readdirSync(d);

    files.forEach(function (file: string) {
      const filePath = d + "/" + file;
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        getFile(filePath);
      } else {
        filesall.push(filePath);
      }
    });
  };
  getFile(dir);

  return filesall;
}

function checkExtension(filePath: string) {
  const ext = path.extname(filePath);
  return ext === ".js";
}

/**
 * 简单处理js文件
 * @param filename 文件名
 */
function processComment(filename: string) {
  if (!fs.existsSync(filename)) {
    return;
  }
  const data = fs.readFileSync(filename, "utf8");

  // add comment
  const comment = "// ";
  const lines = data.split("\n");
  // lines[0] = comment + lines[0];

  let needProcess = false;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith("import ") || line.startsWith("export {")) {
      lines[index] = comment + line;
      needProcess = true;
    } else if (line.startsWith("export function")) {
      lines[index] = line.slice("export ".length);
      needProcess = true;
    }
    //other case
  }
  if (!needProcess) {
    return;
  }
  const commentedData = lines.join("\n");

  // save to new file
  fs.writeFileSync(filename, commentedData);

  console.log(`File ${filename} saved!`);
}

function renameFile(filename: string) {
  if (!filename.endsWith("index.js")) {
    return;
  }
  let res = path.resolve(filename);
  if (!fs.existsSync(res)) {
    return;
  }
  let newname = res.substring(0, res.indexOf(`${path.sep}index.js`)) + ".js";

  fs.renameSync(filename, newname);
}

const deleteEmptyFolders = (dir: string) => {
  let files = fs.readdirSync(dir);
  if (files.length > 0) {
    files.forEach((file) => {
      let fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        deleteEmptyFolders(fullPath);
        if (fs.readdirSync(fullPath).length === 0) {
          fs.rmdirSync(fullPath);
        }
      }
    });
  }
};

function main() {
  const folder = path.resolve("./yao/app");
  let files = getFiles(folder);
  //rename first
  for (const file of files) {
    const isJSFile = checkExtension(file);
    if (!isJSFile) {
      continue;
    }
    renameFile(file);
  }

  deleteEmptyFolders(folder);

  files = getFiles(folder);
  for (const file of files) {
    const isJSFile = checkExtension(file);
    if (!isJSFile) {
      continue;
    }
    processComment(file);
  }
}
main();
