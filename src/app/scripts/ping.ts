import { Process } from "yao-node-client";

export function Ping(message: string) {
  let time = Process("utils.now.datetime");
  console.log(time);
  return time + ":" + message;
}

Ping("hello world");
