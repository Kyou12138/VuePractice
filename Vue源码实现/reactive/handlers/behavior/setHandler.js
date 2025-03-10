import trigger from "../../effect/trigger.js";
import { hasChange, TriggerOpTypes } from "../../utils.js";
import { reactive } from "../../reactive.js";

export default function (target, key, value) {
    //关于操作类型需要进一步判断，有可能是set有可能是add
    const type = target.hasOwnProperty(key)
        ? TriggerOpTypes.SET
        : TriggerOpTypes.ADD;

    //暂存旧值
    const oldValue = target[key];

    //数组的话，存储原数组长度
    const oldLen = Array.isArray(target) ? target.length : undefined;

    //先进行设置
    const result = Reflect.set(target, key, value);

    //需判断是否进行派发更新
    if (hasChange(oldValue, value)) {
        //派发更新
        trigger(target, type, key);
    }

    //数组length变化
    if (Array.isArray(target) && oldLen != target.length) {
        if (key !== "length") {
            //说明length发生隐式变化
            trigger(target, TriggerOpTypes.SET, "length");
        } else {
            //说明length发生显示变化 ，新长度小于旧长度会删除元素
            for (let i = target.length; i < oldLen; i++) {
                trigger(target, TriggerOpTypes.DELETE, i.toString());
            }
        }
    }

    return result;
}
