import { effect } from "./effect/effect.js";
import track from "./effect/track.js";
import trigger from "./effect/trigger.js";
import { TriggerOpTypes, TrackOpTypes } from "./utils.js";

function normalizeParam(getterOrOptions) {
    let getter, setter;
    if (typeof getterOrOptions === "function") {
        getter = getterOrOptions;
        setter = () => {
            console.warn("it has no setter function");
        };
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    return { getter, setter };
}
export function computed(getterOrOptions) {
    //参数归一化
    const { getter, setter } = normalizeParam(getterOrOptions);

    let dirty = true; //数据脏了，才重新计算
    let value;
    const effectFn = effect(getter, {
        lazy: true,
        scheduler: (eff) => {
            // eff();
            dirty = true; //依赖数据发生变动，数据脏了
            //手动派发更新
            trigger(res, TriggerOpTypes.SET, "value");
        },
    });
    const res = {
        get value() {
            //手动依赖收集
            track(res, TrackOpTypes.GET, "value");
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            return value;
        },
        set value(newValue) {
            setter(newValue);
        },
    };
    return res;
}
