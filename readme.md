## api 测试服务器

此 api 服务器主要目的是用来测试 yao js 脚本。方便测试编写 ts 脚本功能。

使用 express 搭建 api 测试服务器，路径的配置从 yao 应用的 apis 目录下读取.

```sh
pnpm i express dotenv
pnpm i -D @types/express
pnpm i -D typescript @types/node
pnpm i express-fileupload
```

express 调试，配置环境变化 DEBUG

```sh
DEBUG=express:*
```

## 功能

在.env 文件中配置变量 YAO_APP_ROOT 来指定 YAO 应用目录

支持 api 配置文件中使用以下参数获取数据

- 支持$query,$form,$payload
- 支持:query-param,:params,转换成 sql 查询参数比较复杂
- 文件上传，需要使用 multipart/form-data 的方式上传。使用的插件是 express-fileupload。api 配置文件使用$file.name 的方式获取。 html 上需要使用`<input name="foo" type="file" />`。postname 需要使用 multipart/form-data 的方式上传，而不是 raw 的方式。

- 不支持$session
- 不支持 api 配置文件中返回使用 bind 的语法。

## 调试

使用了 nodemon，配置文件 nodemon.json,可以同时监控开发目录与 apis 目录

```sh
pnpm run dev:node
```
