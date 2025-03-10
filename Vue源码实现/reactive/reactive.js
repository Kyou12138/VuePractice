//提供reactive api

import handlers from "./handlers/index.js";
import { isObject } from "./utils.js";

//存储代理过的对象,key:原始对象，value：代理对象
const proxyMap = new WeakMap();

/**
 * 将对象转换为 Proxy 对象
 * @param {*} target 原始对象
 */
export function reactive(target) {
    //判断是否是对象
    if (!isObject(target)) {
        return target;
    }

    //已代理
    if (proxyMap.has(target)) {
        return proxyMap.get(target);
    }

    const proxy = new Proxy(target, handlers);

    proxyMap.set(target, proxy);

    return proxy;
}
