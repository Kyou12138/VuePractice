//测试文件

import { reactive } from "./reactive.js";
import { effect } from "./effect/effect.js";
const obj = {
    a: 1,
    b: 2,
    c: {
        name: "张三",
        age: 10,
    },
};
const state = reactive(obj);
const effectFn = effect(
    () => {
        console.log("fn");
        state.a = state.a + 1;
    },
    {
        lazy: true,
        scheduler: (effectFn) => {
            setTimeout(effectFn, 1000);
        },
    }
);
state.a = 100;
effectFn();
state.a++;
state.a++;

// const proxyObj = reactive(obj);
// delete proxyObj.c.name;
// "name" in proxyObj.c;
// for (let key in proxyObj) {
// }

// const arr = [1, 2, obj, 4, 1];
// const proxyObj = reactive(arr);
// // console.log(proxyObj.includes(obj));
// // proxyObj.length = 1;
// proxyObj.push(1);
