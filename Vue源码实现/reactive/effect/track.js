import { TrackOpTypes, ITERATE_KEY } from "../utils.js";
import { activeEffect, targetMap } from "./effect.js";

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
    if (!shouldTrack || !activeEffect) return;

    //一层层往下找依赖的函数集合， target 》 prop 》 type 》 deps

    let propMap = targetMap.get(target);
    if (!propMap) {
        propMap = new Map();
        targetMap.set(target, propMap);
    }

    //对key值做参数归一化，遍历时的key为undefined,现在设置为symbol
    if (type === TrackOpTypes.ITERATE) {
        key = ITERATE_KEY;
    }

    let typeMap = propMap.get(key);
    if (!typeMap) {
        typeMap = new Map();
        propMap.set(key, typeMap);
    }

    let depSet = typeMap.get(type);
    if (!depSet) {
        depSet = new Set();
        typeMap.set(type, depSet);
    }

    //找到set，存储依赖函数
    if (!depSet.has(activeEffect)) {
        depSet.add(activeEffect);
        activeEffect.deps.push(depSet); //将集合存储到环境的deps里
    }
}
