/**
 * yao本地js api代理
 * @param {object} payload
 * @returns
 */
function Server(payload) {
    // console.log("request received");
    // console.log(payload);
    // log.Info("debug served called");
    // log.Info(payload);
    const type = payload.type;
    const method = payload.method;
    const args = payload.args;
    const space = payload.space; //"dsl","script","system"
    let localParams = [];
    if (Array.isArray(args)) {
        localParams = args;
    }
    else {
        localParams.push(args);
    }
    switch (type) {
        case "Process":
            return Process(method, ...localParams);
        case "Studio":
            // @ts-ignore
            __YAO_SU_ROOT = true;
            return Studio(method, ...localParams);
        case "Query":
            const query = new Query();
            return query[method](args);
        case "FileSystem":
            const fs = new FS(space);
            return fs[method](...args);
        case "Store":
            const cache = new Store(space);
            if (method == "Set") {
                return cache.Set(payload.key, payload.value);
            }
            else if (method == "Get") {
                return cache.Get(payload.key);
            }
        case "Http":
            return http[method](...args);
        case "Log":
            // console.log("Log args:", args);
            log[method](...args);
            return {};
        case "WebSocket":
            //目前yao只是实现了push一个方法，也是ws服务连接后push一条信息
            const ws = new WebSocket(payload.url, payload.protocols);
            if (method == "push") {
                ws.push(payload.message);
                return {};
            }
        case "Translate":
            return $L(payload.message);
        default:
            break;
    }
    throw new Exception("操作未支持", 404);
}
