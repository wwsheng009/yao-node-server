import { FS, FSSAPCE } from "../../yao-node-client/filesystem";
function createTemp() {
  const fs1 = new FS(FSSAPCE.System);
  fs1.MkdirTemp("test", "test-*");
}

// function createTemp() {
//     const fs1 = new FS(FSSAPCE.System);
//     fs1.MkdirTemp("test", "test-*");
//   }
export function Add(a: number, b: number) {
  return a + b;
}
