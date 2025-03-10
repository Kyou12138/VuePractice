import track from "../../effect/track.js";
import { TrackOpTypes } from "../../utils.js";
export default function (target, key) {
    //依赖收集
    track(target, TrackOpTypes.HAS, key);

    return Reflect.has(target, key);
}
