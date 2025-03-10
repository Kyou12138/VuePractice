import { TrackOpTypes } from "../utils.js";

let shouldTrack = true; //开关，控制是否需要进行依赖收集

/**
 * 暂停依赖收集
 */
export function pauseTracking() {
    shouldTrack = false;
}

/**
 * 恢复依赖收集
 */
export function resumeTracking() {
    shouldTrack = true;
}

/**
 * 收集器：用于收集依赖
 * @param {*} target 原始对象
 * @param {*} type 进行的操作类型
 * @param {*} key 针对哪一个属性
 */
export default function (target, type, key) {
    if (!shouldTrack) return;

    if (type === TrackOpTypes.ITERATE) {
        // console.log(`收集器：原始对象为：`, target);
        console.log(`收集器：代理对象${type}操作被拦截`);
        return;
    }
    // console.log(`收集器：原始对象为：`, target);
    console.log(`收集器：代理对象${key}属性的${type}操作被拦截`);
}
