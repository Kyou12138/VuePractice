/**
 * 用于记录当前活动的effect
 */
export let activeEffect = undefined;
export const targetMap = new WeakMap(); //用来存储对象及其属性的依赖关系
const effectStack = []; //存储嵌套的堆栈的环境

/**
 * 该函数的作用：执行传入的函数，并在执行的过程中收集依赖
 * @param {Function} fn
 */
export function effect(fn, options = {}) {
    const { lazy = false } = options; //是否懒执行
    const environment = () => {
        try {
            activeEffect = environment;
            effectStack.push(environment);
            cleanup(environment);
            return fn();
        } finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };
    environment.deps = []; //当前函数对应的依赖集合\
    environment.options = options;
    if (!lazy) {
        environment();
    }

    return environment;
}

/**
 * 清理环境
 * @param {Function} environment
 */
export function cleanup(environment) {
    let deps = environment.deps;
    if (deps.length) {
        deps.forEach((dep) => {
            dep.delete(environment);
        });
        deps.length = 0;
    }
}
