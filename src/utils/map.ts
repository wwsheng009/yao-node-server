type MapStrAny = { [key: string]: any };

// Dot The Dot method flattens a multi-dimensional MapStrAny into a single level MapStrAny
// that uses "dot" notation to indicate depth
/**
 * 把多维的对象扁平化成一维的对象
 * @param m 多维对象
 * @returns 一维对象
 */
export function Dot(m: MapStrAny): MapStrAny {
  const res: MapStrAny = {};
  range(m, (key: string, value: any) => {
    dotSet(res, key, value);
    return true;
  });
  return res;
}

// Range calls f sequentially for each key and value present in the map. If f returns false, range stops the iteration.
function range(m: MapStrAny, cb: (key: string, value: any) => boolean): void {
  for (const [key, value] of Object.entries(m)) {
    if (!cb(key, value)) {
      break;
    }
  }
}

// dotSet set the value for a key uses "dot" notation
function dotSet(m: MapStrAny, key: string, value: any): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      //   const element = value[i];
      dotSet(m, `${key}.${i}`, value[i]);
      dotSet(m, `${key}.[${i}]`, value[i]);
      if (i > 256) {
        return;
      }
    }
  } else if (value instanceof Object) {
    for (const sub in value) {
      dotSet(m, `${key}.${sub}`, value[sub]);
    }
  }

  m[key] = value;
}

/**
 * 使用表达式在对象中搜索值，返回新的值。
 * @param value 表达式，{{in.1}}或是?:$in.1
 * @param data 数据对象
 * @param vars 可选的正则表达式
 * @returns 新对象
 */
export function Bind(
  value: any,
  data: MapStrAny,
  ...vars: RegExp[]
): any | MapStrAny {
  if (vars.length == 0) {
    //{{in.2}}，可以在一个字段作多个替换
    //?:$in.2，只适合整个字段替换，
    // vars = [/{{\s*([^\s]+?)\s*}}/g, /\?:([^\s]+)/g];
    // 这里虽然只能绑定一个字段变量，跟yao保持一致，改变正则可以匹配多个。
    vars = [/{{\s*([^\s]+?)\s*}}/g, /\?:([^\s]+)/g];
  }

  let res: any = null;

  if (Array.isArray(value)) {
    let val = [] as MapStrAny[];
    for (let i = 0; i < value.length; i++) {
      //   const element = value[i];
      val.push(Bind(value[i], data));
    }
    res = val;
  } else if (value instanceof Object) {
    let val = {} as MapStrAny;
    for (const key in value) {
      val[key] = Bind(value[key], data);
    }
  } else if (typeof value == "string") {
    let input = value;
    for (const i in vars) {
      const reVar = vars[i];

      const matches = [...value.matchAll(reVar)];
      if (matches.length == 1) {
        res = data[matches[0][1]]; //捕获的分组
        // let o1:RegExpMatchArray;
        break;
      } else if (matches.length > 1) {
        for (const key in matches) {
          let match = matches[key];
          const val = data[match[1]]; //捕获的分组
          input = input.replaceAll(match[0], val);
        }
        res = input;
        break;
      } else {
        res = input;
      }
    }
  } else {
    res = value;
  }
  return res;
}
// let result = dot({
//   key1: "val1",
//   key5: "val1",
//   key2: {
//     key3: [1, 2, 3],
//     key4: [{ sub1: "12" }],
//   },
// });

// let data = { body: { message: "Hello:123333" }, data: "123333" };
// let reslt = Bind(`{{body.message}}`, data);

// console.log(reslt);
