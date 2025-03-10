import trigger from "../../effect/trigger.js";
import { TriggerOpTypes } from "../../utils.js";
export default function (target, key) {
    //判断有该属性再删除和派发更新
    const hadKey = target.hasOwnProperty(key);

    const result = Reflect.deleteProperty(target, key);

    if (hadKey && result) {
        //派发更新
        trigger(target, TriggerOpTypes.DELETE, key);
    }

    return result;
}
