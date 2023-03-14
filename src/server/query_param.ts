import { YaoQueryParam } from "yao-app-ts-types";


// getURLValue 读取URLvalues 数值 return []string | string
function getURLValue(
  values: { [key: string]: string[] | string },
  name: string
): any {
  if (values[name]) {
    if (values[name].length === 1) {
      return values[name][0];
    }
    return values[name];
  }
  return "";
}

// "select", "name,secret,status,type" -> []interface{"name","secret"...}
function setSelect(param: YaoQueryParam.QueryParam, value: string) {
  const selects: (string | any)[] = [];
  const colmns = value.split(",");
  for (const column of colmns) {
    selects.push(column.trim());
  }
  param.select = selects;
}

// "group.types.where.type.eq", "admin"
function setGroupWhere(
  groups: { [key: string]: YaoQueryParam.QueryWhere[] },
  name: string,
  value: any
) {
  const matches = name.match(
    /^group\.([a-zA-Z_]{1}[0-9a-zA-Z_]+)\.(where|orwhere|wherein|orwherein)\.(.+)\.eq$/
  );
  const group = matches[1];
  const method = matches[2];
  const colinfo = matches[3].split(".");
  const length = colinfo.length;
  const column = colinfo[length - 1];
  let rel = "";
  if (length > 1) {
    rel = colinfo.slice(0, length - 1).join(".");
  }
  const op = matches[4];

  const where: YaoQueryParam.QueryWhere = {
    method,
    op,
    column,
    rel,
    value,
  };
  if (!groups[group]) {
    groups[group] = [];
  }
  groups[group].push(where);
}

// "where.status.eq" , "enabled" -> []Wheres{...}
function setWhere(param: YaoQueryParam.QueryParam, name: string, value: any) {
  const matches = name.match(/^(where|orwhere|wherein|orwherein)\.(.+)\.eq$/);
  const method = matches[1];
  const colinfo = matches[2].split(".");
  const length = colinfo.length;
  const column = colinfo[length - 1];
  let rel = "";
  if (length > 1) {
    rel = colinfo.slice(0, length - 1).join(".");
  }
  const op = matches[3];
  const where: YaoQueryParam.QueryWhere = {
    method,
    op,
    column,
    rel,
    value,
  };
  param.wheres.push(where);
}

// "order.id" , "desc"
function setOrder(param: YaoQueryParam.QueryParam, name: string, value: string) {
  const orders = value.split(",");
  for (const order of orders) {
    let column = order;
    let option = "asc";

    if (order.includes(".")) {
      const colinfo = order.split(".");
      const last = colinfo[colinfo.length - 1];
      if (last === "asc" || last === "desc") {
        option = last;
        column = colinfo.slice(0, 1).join(".");
      }
    }
    param.orders.push({
      column,
      option,
    });
  }
}
// "with", "mother,addresses" -> map[string]With
function setWith(param: YaoQueryParam.QueryParam, value: string) {
  const withs = value.split(",");
  for (const withx in withs) {
    const name = withx.trim();
    if (!param.withs[name]) {
      param.withs[name] = {
        name,
        query: {},
      };
    }
  }
}
// "mother.select", "name,mobile,type,status" -> map[string]With
function setWithSelect(param: YaoQueryParam.QueryParam, name: string, value: string) {
  const namer = name.split(".");
  const withName = namer[0];
  if (!param.withs[withName]) {
    setWith(param, withName);
  }

  const selects: (string | any)[] = [];
  const colmns = value.split(",");
  for (const column of colmns) {
    selects.push(column.trim());
  }
  const withx = param.withs[withName];
  withx.query.select = selects;
  param.withs[withName] = withx;
}

// URLToQueryParam url.Values 转换为 QueryParams
export function URLToQueryParam(values: { [key: string]: string }): YaoQueryParam.QueryParam {
  const param: YaoQueryParam.QueryParam = {
    withs: {},
    wheres: [],
  };
  const whereGroups: { [key: string]: YaoQueryParam.QueryWhere[] } = {};
  for (const name in values) {
    if (name === "select") {
      setSelect(param, values[name]);
      continue;
    } else if (name === "order") {
      setOrder(param, name, values[name]);
      continue;
    } else if (name.match(/^(where|orwhere|wherein|orwherein)\.(.+)\.eq$/)) {
      setWhere(param, name, getURLValue(values, name));
      continue;
    } else if (name.startsWith("group.")) {
      setGroupWhere(whereGroups, name, getURLValue(values, name));
      continue;
    } else if (name === "with") {
      setWith(param, values[name]);
      continue;
    } else if (name.endsWith(".select")) {
      setWithSelect(param, name, values[name]);
      continue;
    }
  }
  // WhereGroups
  for (const wheres of Object.values(whereGroups)) {
    param.wheres.push({
      wheres,
    });
  }
  return param;
}
