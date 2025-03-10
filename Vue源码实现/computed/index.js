import { computed } from "./computed.js";
import { effect } from "../reactive/effect/effect.js";
import { reactive } from "../reactive/reactive.js";

const state = reactive({
    a: 1,
    b: 2,
});
const sum = computed(() => {
    console.log("计算属性计算..");
    return state.a + state.b;
});
// console.log(sum.value);
// console.log(sum.value);
// state.b = 11;
// console.log(sum.value);

effect(() => {
    console.log("render: ", sum.value);
});

state.a = 1000;
