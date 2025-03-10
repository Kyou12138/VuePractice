//触发器
import { TriggerOpTypes, TrackOpTypes, ITERATE_KEY } from "../utils.js";
import { targetMap, activeEffect } from "./effect.js";

const triggerTypeMap = {
    [TriggerOpTypes.SET]: [TrackOpTypes.GET],
    [TriggerOpTypes.ADD]: [
        TrackOpTypes.GET,
        TrackOpTypes.ITERATE,
        TrackOpTypes.HAS,
    ],
    [TriggerOpTypes.DELETE]: [
        TrackOpTypes.GET,
        TrackOpTypes.ITERATE,
        TrackOpTypes.HAS,
    ],
};

/**
 * 触发器
 * @param {*} target 原始对象
 * @param {*} type 操作的类型
 * @param {*} key 操作的属性
 */
export default function (target, type, key) {
    //找到依赖函数并执行
    const effectFns = getEffectFns(target, type, key);
    if (!effectFns) return;
    for (const effectFn of effectFns) {
        if (effectFn === activeEffect) continue;

        if (effectFn.options && effectFn.options.scheduler) {
            //说明用户传递了回调函数，用户自己处理依赖函数
            effectFn.options.scheduler(effectFn);
        } else {
            //执行依赖函数
            effectFn();
        }
    }
}

/**
 * 根据target, type, key找到对应的依赖函数集合
 * @param {*} target
 * @param {*} type
 * @param {*} key
 */
function getEffectFns(target, type, key) {
    const propMap = targetMap.get(target);

    if (!propMap) return;

    //如果是新增或删除操作，会涉及额外触发
    const keys = [key];
    if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
        keys.push(ITERATE_KEY);
    }

    const effectFns = new Set();

    for (const key of keys) {
        const typeMap = propMap.get(key);
        if (!typeMap) continue;

        const trackTypes = triggerTypeMap[type];
        for (const trackType of trackTypes) {
            const deps = typeMap.get(trackType);
            if (!deps) continue;
            for (const effectFn of deps) {
                effectFns.add(effectFn);
            }
        }
    }
    return effectFns;
}
