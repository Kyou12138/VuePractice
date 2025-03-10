//测试
import { watch } from "./watch.js";
import { reactive } from "../reactive/reactive.js";

const x = reactive({
    a: 1,
    b: 2,
});

//单个ref
// watch(x, (newX) => {
//     console.log(`x：}`, newX);
// });

//getter
const unwatch = watch(
    () => x.a + x.b,
    (sum) => {
        console.log(`sum：${sum}`);
    },
    {
        immediate: true,
    }
);

x.a = 30;
// unwatch();
x.b = 20;
