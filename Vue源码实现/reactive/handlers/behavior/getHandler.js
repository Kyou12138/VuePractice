import track, { pauseTracking, resumeTracking } from "../../effect/track.js";
import { RAW, isObject, TrackOpTypes } from "../../utils.js";
import { reactive } from "../../reactive.js";

const arrayInstrumentations = {};
//重写数组相关方法
["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    arrayInstrumentations[key] = function (...args) {
        // 1. 先正常找，此时this指向的是代理对象
        const res = Array.prototype[key].apply(this, args);
        // 2. 找不到的话再从原始对象this[RAW]中找
        if (res < 0 || res === false) {
            return Array.prototype[key].apply(this[RAW], args);
        }
        return res;
    };
});

//重写push pop shift unshift
//调用这几个方法要暂停依赖收集，调用完毕再恢复
["push", "pop", "shift", "unshift"].forEach((key) => {
    arrayInstrumentations[key] = function (...args) {
        pauseTracking();
        const res = Array.prototype[key].apply(this, args);
        resumeTracking();
        return res;
    };
});

export default function (target, key) {
    //这里的RAW是特殊标识，用于获取原始对象
    if (key === RAW) return target;

    //依赖收集
    track(target, TrackOpTypes.GET, key);

    //针对数组的某些方法，需要进行一个重写，避免判断错误
    if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return arrayInstrumentations[key];
    }

    const result = Reflect.get(target, key);

    //属性为对象需要递归处理
    if (isObject(result)) {
        return reactive(result);
    }

    return result;
}
