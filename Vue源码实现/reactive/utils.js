//提供工具方法
/**
 * 收集依赖的操作类型
 */
export const TrackOpTypes = {
    GET: "get",
    HAS: "has",
    ITERATE: "iterate",
};

/**
 * 触发器的操作类型
 */
export const TriggerOpTypes = {
    SET: "set",
    ADD: "add",
    DELETE: "delete",
};

/**
 * 判断对象是否为object
 * @param {*} target 要判断的值
 * @returns
 */
export function isObject(target) {
    return typeof target === "object" && target !== null;
}

/**
 * 判断值是否改变
 * @param {*} oldValue
 * @param {*} newValue
 */
export function hasChange(oldValue, newValue) {
    // NaN === NaN 为false, Object.is 为true
    //+0 === -0 为true, Object.is 为false
    return !Object.is(oldValue, newValue);
}

/**
 * 特殊标识
 */
export const RAW = Symbol("raw");

export const ITERATE_KEY = Symbol("iterate");
