import { cleanup, effect } from "../reactive/effect/effect.js";

/**
 * 监听
 * @param {*} source 响应式数据或者getter （数组暂不实现
 * @param {*} cb 要执行的回调函数
 * @param {*} options 选项对象
 */
export function watch(source, cb, options = {}) {
    //1. 参数归一化
    let getter;
    if (typeof source === "function") {
        getter = source;
    } else {
        getter = () => traverse(source);
    }

    let oldValue, newValue; //存储getter上一次的值和当前值
    let job = () => {
        newValue = effectFn();
        cb(newValue, oldValue);
        oldValue = newValue;
    };
    const effectFn = effect(() => getter(), {
        lazy: true,
        scheduler: () => {
            if (options.flush === "post") {
                Promise.resolve().then(job);
            } else {
                job();
            }
        },
    });

    if (options.immediate) {
        job();
    } else {
        effectFn();
    }

    return () => {
        cleanup(effectFn);
    };
}

/**
 * 用于深度遍历对象的所有属性，以便触发依赖收集
 * @param {*} value
 * @param {*} seen
 */
function traverse(value, seen = new Set()) {
    if (typeof value !== "object" || value === null || seen.has(value))
        return value;

    seen.add(value);

    for (const key in value) {
        traverse(value[key], seen);
    }

    return value;
}
