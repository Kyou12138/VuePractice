//触发器

/**
 * 触发器
 * @param {*} target 原始对象
 * @param {*} type 操作的类型
 * @param {*} key 操作的属性
 */
export default function (target, type, key) {
    // console.log("触发器：原始对象为：", target);
    console.log(`触发器：代理对象${key}属性的${type}操作被拦截`);
}
