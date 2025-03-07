# Vue响应式的设计与实现
[toc]

Vue的最大特点：它能够实现视图和数据的关联

目标1：实现视图和数据的关联

视图：虚拟dom

目标2：实现 【创建视图的过程】和【数据】的关联

目标3：实现【函数】和【数据】的关联

目标4：实现【函数】和【函数运行中用到的数据】的关联

从设计的角度看，要关联哪些数据要交给用户决定；问题是如何提供一种机制让用户来告诉我们哪些数据要关联

目标5：实现【函数】和【函数运行中用到的**标记**数据】的关联

如何关联？建立对应关系。

如何建立？

1. 监听数据的读取和修改
2. 找到数据对应的函数

语言层面，JS如何实现：

1. 监听数据的读取和修改（Vue中叫 reactive）

   - **defineProperty: Vue2，只能监听已有属性的读取和赋值，但是兼容性更好**
   - **Proxy: Vue3, 监听范围更广，只能兼容支持ES6的浏览器**

   JS只能通过上述两种方法监听对象，所以要监听的数据只能是对象，vue3中将该监听对象命名为reactive，即响应式数据（本质是Proxy对象）

2. 找到数据对应的函数 和 执行（Vue中叫依赖收集和派发更新（effect）



vue的响应式系统：reactive + effect

## 监听数据的读取和修改

分解成下面三个目标

### 1、监听

对象 --> 代理

WeakMap缓存代理过的对象

### 2、读

读到对象的信息, 如下表

| 读什么信息       | Proxy拦截 \| 反射的方法 |
| ---------------- | ----------------------- |
| 读属性值         | get                     |
| 判断属性是否存在 | has                     |
| 迭代属性         | ownKeys                 |

**依赖收集**：建立对象的属性和函数的对应关系

### 3、写

更改了对象的信息，如下表

| 怎么改变的 | Proxy拦截 \| 反射的方法                       |
| ---------- | --------------------------------------------- |
| 设置属性值 | set（需判断值有没有改变，改变才触发）         |
| 添加属性   | set (需判断存不存在，不存在即为添加）         |
| 删除属性   | deleteProperty (需判断存不存在，不存在不触发) |

**派发更新**：改了哪个对象的哪个属性，把属性对应的函数执行一遍

# 面试题

# Vue3整体变化

> 面试题：说一下 Vue3 相比 Vue2 有什么新的变化？

主要有这么几类变化：

1. 源码上的变化
2. 性能的变化
3. 语法API的变化
4. 引入RFC



## 源码优化

**1. Monorepo**

Vue2 的源码是托管在 src 目录下面的，然后依据功能拆分出了：

- compiler：编译器
- core：和平台无关的通用运行时代码
- platforms：平台专有代码
- server：服务端渲染相关代码
- sfc：单文件组件解析相关代码
- shared：共享工具库代码

但是各个模块**无法单独抽离**出来下载安装，也无法针对单个模块进行发布。

Vue3 源码工程的搭建改为了 Monorepo 的形式，将模块拆分到了不同的包里面，每个包有各自的 API、类型定义以及测试。这样一类粒度更细，责任划分更加明确。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-21-073731.png" alt="image-20240821153730971" style="zoom:50%;" />

**2. Typescript**

- Vue1.x：纯 JS 开发，无类型系统
- Vue2.x：Flow.js，这是 Facebook 推出的类型系统
- Vue3.x：TypeScript

## 性能优化

**1. 源码体积缩小**

- 移除冷门功能：filter、inline-template 这些特性被去除掉了
- 生产环境采用 rollup 进行构建，利用 tree-shaking 减少用户代码打包的体积

**2. 数据劫持优化**

- Vue2.x：Object.defineProperty
- Vue3.x：Proxy

**3. 编译优化**

模板本质上是语法糖，最终会被编译器编译为渲染函数。

1. 静态提升
2. 预字符串化
3. 缓存事件处理函数
4. Block Tree
5. PatchFlag

**4. diff算法优化**

- Vue2.x: 双端 diff 算法
- Vue3.x: 快速 diff 算法

## 语法API优化

**1. 优化逻辑组织**

- Vue2.x: OptionsAPI，逻辑代码按照 data、methods、computed、props 进行分类
- Vue3.x: OptionsAPI + CompositionAPI（推荐）
  - CompositionAPI优点：查看一个功能的实现时候，不需要在文件跳来跳去；并且这种风格代码可复用的粒度更细


<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-26-033538.jpg" alt="16028271652994" style="zoom:50%;" />

**2. 优化逻辑复用**

Vue2.x: 复用逻辑使用 mixin，但是 mixin 本身有一些缺点：

- 不清晰的数据来源
- 命名空间冲突
- 隐式的跨mixin交流

参阅Vue课程《细节补充 - 组合式函数》

**3. 其他变化**

Vue2

```js
import App from './App.vue'
// 通过实例化 Vue 来创建应用
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
// or
new Vue({
  render: h => h(App),
}).$mount('#app')
```

思考🤔：这种方式存在什么问题？

答案：这种方式缺点在于一个页面如果存在多个 Vue 应用，部分配置会影响所有的 Vue 应用

```vue
<!-- vue2 -->
<div id="app1"></div>
<div id="app2"></div>
<script>
  Vue.use(...); // 此代码会影响所有的vue应用
  Vue.mixin(...); // 此代码会影响所有的vue应用
  Vue.component(...); // 此代码会影响所有的vue应用
                
	new Vue({
    // 配置
  }).$mount("#app1")
  
  new Vue({
    // 配置
  }).$mount("#app2")
</script>
```

Vue3

```js
import { createApp } from 'vue';
import App from './App.vue'

createApp(App).mount('#app');
```

这种方式就能很好的规避上面的问题：

```vue
<!-- vue3 -->
<div id="app1"></div>
<div id="app2"></div>
<script>  
	createApp(根组件).use(...).mixin(...).component(...).mount("#app1")
  createApp(根组件).mount("#app2")
</script>
```

> 面试题：为什么 Vue3 中去掉了 Vue 构造函数？
>
> 参考答案：
>
> Vue2 的全局构造函数带来了诸多问题：
>
> 1. 调用构造函数的静态方法会对所有vue应用生效，不利于隔离不同应用
> 2. Vue2 的构造函数集成了太多功能，不利于 tree shaking，Vue3 把这些功能使用普通函数导出，能够充分利用 tree shaking 优化打包体积
> 3. Vue2 没有把组件实例和 Vue 应用两个概念区分开，在 Vue2 中，通过 new Vue 创建的对象，既是一个 Vue 应用，同时又是一个特殊的 Vue 组件。Vue3 中，把两个概念区别开来，通过 createApp 创建的对象，是一个 Vue 应用，它内部提供的方法是针对整个应用的，而不再是一个特殊的组件。

## 引入RFC

RFC 全称是 Request For Comments. 这是一种在软件开发和开源项目中常用的提案流程，用于收集社区对某个新功能、改动或标准的意见和建议。

RFC 是一种文档格式，它详细描述了某个特性或更改的提议，讨论其动机、设计选择、实现细节以及潜在的影响。在通过讨论和反馈达成共识后，RFC 会被采纳或拒绝。一份 RFC 主要的组成部分有：

1. 标题：简短描述提案的目的。
2. 摘要：简要说明提案的内容和动机。
3. 动机：解释为什么需要这个提案，解决了什么问题。
4. 详细设计：深入描述提案的设计和实现细节。
5. 潜在问题和替代方案：讨论可能存在的问题和可以考虑的替代方案。
6. 不兼容的变更：描述提案是否会引入不兼容的变更，以及这些变更的影响。

通过 RFC，Vue 核心团队能够更好地倾听用户的需求和建议，从而开发出更加符合社区期待的功能和特性。

> 面试题：说一下 Vue3 相比 Vue2 有什么新的变化？
>
> 参考答案：
>
> Vue3 相比 Vue2 的整体变化，可以分为好几大类：
>
> 1. 源码优化
> 2. 性能优化
> 3. 语法 API 优化
> 4. 引入 RFC
>
> **源码优化**体现在使用 typescript 重构整个 Vue 源码，对冷门的功能进行了删除，并且整个源码的结构变为了使用 Monorepo 进行管理，这样粒度更细，不同的包可以独立测试发布。用户也可以单独引入某一个包使用，而不用必须引入 Vue.
>
> **性能上的优化**是整个 Vue3 最核心的变化，通过优化响应式、diff算法、模板编译，Vue3 的性能相比 Vue2 有质的飞跃，基本上将性能这一块儿做到了极致。所以 Vue 的新项目建议都使用 Vue3 来搭建。
>
> 不过性能层面的优化，开发者无法直接的感知，开发者能够直接感知的，是**语法上的优化**，例如 Vue3 提出的 CompositionAPI，用于替代 Vue2 时期的 OptionsAPI. 这样能够让功能逻辑更加集中，无论是在阅读还是修改都更加方便。另外 CompositionAPI 让代码复用的粒度上更细，不需要再像以前一样使用 mixin 复用逻辑，而是推荐使用组合式函数来复用逻辑。
>
> 不过 Vue3 也不是完全废弃了 OptionsAPI，在 Vue3 中，OptionsAPI 成为了一种编码风格。
>
> 最后就是引入 RFC，尤雨溪和核心团队广泛采用了 RFC 的流程来处理新功能和重大更改。

---

# Vue2响应式回顾

>面试题：说一说 Vue3 响应式相较于 Vue2 是否有改变？如果有，那么说一下具体有哪些改变？

**观察者模式**

生活中的观察者模式：

假设顾客对新型号的手机感兴趣，但是目前商店还没到货，那么顾客及时如何买到新型号的手机？

1. 顾客每天去一趟商场 🙅
2. 商品到货后没所有顾客发出通知 🙅

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-03-22-074632.png" alt="image-20240322154631735" style="zoom:50%;" />

我们似乎遇到了一个矛盾：要么让顾客浪费时间检查产品是否到货，要么让商店浪费资源去通知没有需求的顾客。

解决方案：其实很简单，让有需求的顾客（watcher）主动订阅即可，之后商店（dep）只需要给订阅了用户发送通知。



**Vue2响应式工作机制**

1. data 中的数据会被 Vue 遍历生成 getter 和 setter，这样一来当访问或设置属性时，Vue 就有机会做一些别的事情。
2. 每个组件实例都对应一个 watcher 实例，它会在组件渲染的过程中把“接触”过的数据 property 记录为依赖。之后当依赖项的 setter 触发时，会通知 watcher，从而使它关联的组件重新渲染。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-074111.png" alt="image-20240901154111493" style="zoom:40%;" />



几个比较重要的点：

1. 劫持数据：通过 Object.defineProperty 方法来做数据劫持，生成 getter 和 setter 从而让获取/设置值的时候可以做一些其他的事情。
2. 发布者：记录依赖，也就是数据和 watcher 之间的映射关系
3. 观察者：watcher 会被发布者记录，数据发生变化的时候，发布者会会通知 watcher，之后 watcher 执行相应的处理



**劫持数据**

劫持数据对象，是 Observer 的工作，它的目标很简单，就是把一个普通的对象转换为响应式的对象

为了实现这一点，Observer 把对象的每个属性通过 Object.defineProperty 转换为带有 getter 和 setter 的属性，这样一来，当访问或设置属性时，Vue 就有机会做一些别的事情。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-052809.png" alt="20210226153448" style="zoom:67%;" />

Observer 是 Vue 内部的构造器，我们可以通过 Vue 提供的静态方法 Vue.observable( object ) 间接的使用该功能。

在组件生命周期中，这件事发生在 beforeCreate 之后，created 之前。

具体实现上，**它会递归遍历对象的所有属性，以完成深度的属性转换**。由于遍历时只能遍历到对象的当前属性，因此无法监测到将来动态增加或删除的属性，因此 Vue 提供了 $set 和 $delete 两个实例方法，让开发者通过这两个实例方法对已有响应式对象添加或删除属性。对于数组，Vue 会更改它的隐式原型，之所以这样做，是因为 Vue 需要监听那些可能改变数组内容的方法。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-052949.png" alt="20210226154624" style="zoom:67%;" />

总之，Observer 的目标，就是要让一个对象，它属性的读取、赋值，内部数组的变化都要能够被 Vue 感知到。



**发布者(商店)**

发布者，也被称之为依赖管理器，对应英文 Dependency，简称 Dep.

其中最核心的两个功能：

- 能够添加观察者：当读取响应式对象的某个属性时，它会进行依赖收集
- 能够通知观察者：当改变某个属性时（商品发售了），它会派发更新（通知所有顾客）

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-053233.png" alt="20210226155852" style="zoom:67%;" />



**观察者**

当依赖的数据发生变化时，发布者会通知每一个观察者，而观察者需要调用 update 来更新数据。



**scheduler**

Vue2 内部实现中，还存在一个 Scheduler，因为Dep 通知 watcher 之后，如果 watcher 执行重运行对应的函数，就有可能导致函数频繁运行，从而导致效率低下

试想，如果一个交给 watcher 的函数，它里面用到了属性 a、b、c、d，那么 a、b、c、d 属性都会记录依赖，于是下面的代码将触发 4 次更新：

```js
state.a = "new data";
state.b = "new data";
state.c = "new data";
state.d = "new data";
```

这样显然是不合适的，因此，watcher 收到派发更新的通知后，实际上不是立即执行对应函数，而是把自己交给一个叫调度器的东西

调度器维护一个执行队列，该**队列同一个 watcher 仅会存在一次，队列中的 watcher 不是立即执行，它会通过一个叫做 nextTick 的工具方法，把这些需要执行的 watcher 放入到事件循环的微队列中**，也就是说，当响应式数据变化时，render 函数的执行是**异步**的，并且在**微队列**中。



**Vue2响应式整体流程**

![20210226163936](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-053804.png)

几个核心部件：

1. Observer：用于劫持数据对象，把对象的每个属性通过 Object.defineProperty 转换为带有 getter 和 setter 的属性
2. Dep(商店)：发布者，也被称之为依赖管理器
   - 能够添加观察者：当读取响应式对象的某个属性时，它会进行依赖收集
   - 能够通知观察者：当改变某个属性时，它会派发更新
3. Watcher（顾客）：负责具体的更新操作（可以理解为用户收到商场的邮件后，自身要做什么事情）
4. Scheduler：负责调度。

---

-EOF-

# Vue3响应式变化

>面试题：说一说 Vue3 响应式相较于 Vue2 是否有改变？如果有，那么说一下具体有哪些改变？

**1. 变化一**

首当其冲的就是数据拦截的变化：

- Vue2: 使用 Object.defineProperty 进行拦截
- Vue3: 使用 Proxy + Object.defineProperty 进行拦截

**两者的共同点**

- 都可以针对对象成员拦截
- 都可以实现深度拦截

**两者的差异点**

- 拦截的广度
  - Object.defineProperty 是针对对象特定**属性**的**读写**操作进行拦截，这意味着之后新增加/删除的属性是侦测不到的
  - Proxy 则是针对**一整个对象**的多种操作，包括属性的读取、赋值、属性的删除、属性描述符的获取和设置、原型的查看、函数调用等行为能够进行拦截。
- 性能上的区别：在大多数场景下，Proxy 比 Object.defineProperty 效率更高，拦截方式更加灵活。



**2. 变化二**

创建响应式数据上面的变化：

- Vue2: 通过 data 来创建响应式数据
- Vue3: 通过 ref、reactvie 等方法来创建响应式数据
  - ref：使用 Object.defineProperty + Proxy 方式
  - reactive：使用 Proxy 方式

**对应源码**

```js
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(
    value: T,
    public readonly __v_isShallow: boolean,
  ) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    // 有可能是原始值，有可能是 reactive 返回的 proxy
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    // 收集依赖 略
    return this._value
  }

  set value(newVal) {
    // 略
  }
}

// 判断是否是对象，是对象就用 reactive 来处理，否则返回原始值
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value
```

```js
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>,
) {
  // ...
    
  // 创建 Proxy 代理对象
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers,
  )
  proxyMap.set(target, proxy)
  return proxy
}

export function reactive(target: object) {
  // ...
  
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap,
  )
}
```



**3. 变化三**

依赖收集上面的变化：

- Vue2：Watcher + Dep
  - 每个响应式属性都有一个 Dep 实例，用于做依赖收集，内部包含了一个数组，存储依赖这个属性的所有 watcher
  - 当属性值发生变化，dep 就会通知所有的 watcher 去做更新操作

- Vue3：WeakMap + Map + Set
  - Vue3 的依赖收集粒度更细
  - WeakMap 键对应的是响应式对象，值是一个 Map，这个 Map 的键是该对象的属性，值是一个 Set，Set 里面存储了所有依赖于这个属性的 effect 函数


总结起来，Vue3相比Vue2的依赖追踪粒度更细，Vue2依赖收集收集的是具体的Watcher（组件），Vue3依赖收集收集的是对应的副作用函数。

> 面试题：说一说 Vue3 响应式相较于 Vue2 是否有改变？如果有，那么说一下具体有哪些改变？
>
> 参考答案：
>
> 相比较 Vue2，Vue3 在响应式的实现方面有这么一些方面的改变：
>
> 1. 数据拦截从 Object.defineProperty 改为了 Proxy + Object.defineProperty 的拦截方式，其中
>    - ref：使用 ObjectdefineProperty + Proxy 方式
>    - reactive：使用 Proxy 方式
> 2. 创建响应式数据在语法层面有了变化：
>    - Vue2: 通过 data 来创建响应式数据
>    - Vue3: 通过 ref、reactvie 等方法来创建响应式数据
> 3. 依赖收集上面的变化
>    - Vue2：Watcher + Dep
>    - Vue3：WeakMap + Map + Set
>    - 这种实现方式可以实现更细粒度的依赖追踪和更新控制

---

-EOF-

# nextTick实现原理

>面试题：Vue 的 nextTick 是如何实现的？

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="increment">增加计数</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  for (let i = 1; i <= 1000; i++) {
    count.value = i
  }
}
</script>
```

思考🤔：点击按钮后，页面会渲染几次？

答案：只会渲染一次，同步代码中多次对响应式数据做了修改，多次修改会被**合并**为一次，之后根据最终的修改结果**异步**的去更新 DOM.

思考🤔：倘若不合并，并且同步的去修改DOM，会有什么样的问题？

答案：如果不进行合并，并且数据一变就同步更新DOM，会导致频繁的重绘和重排，这非常耗费性能。

思考🤔：异步更新会带来问题

答案：无法及时获取到更新后的DOM值

原因：因为获取DOM数据是同步代码，DOM的更新是异步的，同步代码会先于异步代码执行。

解决方案：将获取DOM数据的同步任务包装成一个微任务，浏览器在完成一次渲染后，就会立即执行微任务。



当前我们自己的解决方案：

```js
const increment = () => {
  count.value++

  Promise.resolve().then(() => {
    console.log('最新的数据：', count.value)
    console.log('通过DOM拿textContent数据：', counterRef.value.textContent)
    console.log('通过DOM拿textContent数据：', document.getElementById('counter').textContent)
    console.log('通过DOM拿innerHTML数据：', counterRef.value.innerHTML)
    console.log('通过DOM拿innerHTML数据：', document.getElementById('counter').innerHTML)
  })
}
```

nextTick 帮我们做的就是上面的事情，将一个任务包装成一个微任务。

```js
const increment = () => {
  count.value++

  nextTick(() => {
    console.log('最新的数据：', count.value)
    console.log('通过DOM拿textContent数据：', counterRef.value.textContent)
    console.log('通过DOM拿textContent数据：', document.getElementById('counter').textContent)
    console.log('通过DOM拿innerHTML数据：', counterRef.value.innerHTML)
    console.log('通过DOM拿innerHTML数据：', document.getElementById('counter').innerHTML)
  })
}
```

nextTick 返回的是一个 Promise

```js
const increment = async () => {
  count.value++

  await nextTick()
  console.log('最新的数据：', count.value)
  console.log('通过DOM拿textContent数据：', counterRef.value.textContent)
  console.log('通过DOM拿textContent数据：', document.getElementById('counter').textContent)
  console.log('通过DOM拿innerHTML数据：', counterRef.value.innerHTML)
  console.log('通过DOM拿innerHTML数据：', document.getElementById('counter').innerHTML)
}
```

$nextTick，首先这是一个方法，是 Vue 组件实例的方法，用于 OptionsAPI 风格的。

```js
export default {
  data() {
    return {
      count: 1,
      counterRef: null
    }
  },
  methods: {
    increment() {
      this.count++
      this.$nextTick(() => {
        // 在下一个 DOM 更新循环后执行的回调函数
        console.log('最新数据为:', this.count)
        console.log('拿到的DOM:', document.getElementById('counter'))
        console.log('拿到的DOM:', this.$refs.counterRef)
        console.log('通过DOM拿数据:', document.getElementById('counter').textContent)
        console.log('通过DOM拿数据:', document.getElementById('counter').innerHTML)
        console.log('通过DOM拿数据:', this.$refs.counterRef.textContent)
        console.log('通过DOM拿数据:', this.$refs.counterRef.innerHTML)
      })
    }
  }
}
```



[nextTick源码](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/scheduler.ts)

```js
// 创建一个已经解析的 Promise 对象，这个 Promise 会立即被解决，
// 用于创建一个微任务（microtask）。
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>

// 一个全局变量，用于跟踪当前的刷新 Promise。
// 初始状态为 null，表示当前没有刷新任务。
let currentFlushPromise: Promise<void> | null = null

// queueFlush 函数负责将刷新任务（flushJobs）放入微任务队列。
// 这是 Vue 的异步更新机制的核心部分，用于优化性能。
function queueFlush() {
  // 检查是否已经在刷新（isFlushing）或者刷新任务是否已被挂起（isFlushPending）。
  if (!isFlushing && !isFlushPending) {
    // 设置 isFlushPending 为 true，表示刷新任务已被挂起，正在等待执行。
    isFlushPending = true
    // 将 currentFlushPromise 设置为 resolvedPromise.then(flushJobs)
    // 这将创建一个微任务，当 resolvedPromise 被解决时，执行 flushJobs 函数。
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

// nextTick 函数用于在下一个 DOM 更新循环之后执行一个回调函数。
// 它返回一个 Promise，这个 Promise 会在 DOM 更新完成后解决。
export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,  // 可选的回调函数，在 DOM 更新之后执行
): Promise<Awaited<R>> {
  // 如果 currentFlushPromise 不为 null，使用它；否则使用 resolvedPromise。
  // 这样可以确保在 DOM 更新之后再执行回调。
  const p = currentFlushPromise || resolvedPromise
  
  // 如果传入了回调函数 fn，返回一个新的 Promise，在 p 解决之后执行 fn。
  // 使用 this 绑定来确保回调函数的上下文正确。
  return fn ? p.then(this ? fn.bind(this) : fn) : p
  // 如果没有传入回调函数 fn，直接返回 Promise p，这样外部代码可以使用 await 等待 DOM 更新完成。
}
```



>面试题：Vue 的 nextTick 是如何实现的？
>
>参考答案：
>
>nextTick 的本质将回调函数包装为一个微任务放入到微任务队列，这样浏览器在完成渲染任务后会优先执行微任务。
>
>nextTick 在 Vue2 和 Vue3 里的实现有一些不同：
>
>1. Vue2 为了兼容旧浏览器，会根据不同的环境选择不同包装策略：
>
>  - 优先使用 Promise，因为它是现代浏览器中最有效的微任务实现。
>
>  - 如果不支持 Promise，则使用 MutationObserver，这是另一种微任务机制。
>
>  - 在 IE 环境下，使用 setImmediate，这是一种表现接近微任务的宏任务。
>
>  - 最后是 setTimeout(fn, 0) 作为兜底方案，这是一个宏任务，但会在下一个事件循环中尽快执行。
>
>
>2. Vue3 则是只考虑现代浏览器环境，直接使用 Promise 来实现微任务的包装，这样做的好处在于代码更加简洁，性能更高，因为不需要处理多种环境的兼容性问题。
>
>整体来讲，Vue3 的 nextTick 实现更加简洁和高效，是基于现代浏览器环境的优化版本，而 Vue2 则为了兼容性考虑，实现层面存在更多的兼容性代码。

# 两道代码题

面试题1

完成 Component 类代码的书写，要求：

1. 修改数据时能够触发 render 方法的执行
2. 同步变更时需要合并，仅触发一次 render 方法

```js
class Component {
  data = {
    name: "",
  };
  constructor() {
  }
  render() {
    console.log(`render - name: ${this.data.name}`);
  }
}

const com = new Component();
// 要求以下代码需要触发 render 方法，并且同步变更需要合并
com.data.name = "张三";
com.data.name = "李四";
com.data.name = "王五";

setTimeout(() => {
  com.data.name = "渡一";
}, 0);
```



面试题2

以下两段代码在 Vue 中分别渲染几次？为什么？

代码一：

```vue
<template>
	<div>{{rCount}}</div>
</template>
<script setup>
import { ref } from 'vue';
const count = 0;
const rCount = ref(count);
for(let i = 1; i <= 5; ++i){
	rCount.value = i;
}
</script>
```

代码二：

```vue
<template>
	<div>{{rCount}}</div>
</template>
<script setup>
import { ref } from 'vue';
const count = 0;
const rCount = ref(count);
for(let i = 1; i <= 5; ++i){
 setTimeout(()=>{
   rCount.value = i;
 }, 0);
}
</script>
```

- 代码一：2次，初始化渲染1次，之后虽然在 for 循环中修改了 5 次响应式数据，但是会被合并，因此之后只会渲染 1次。
- 代码二：6次，初始化渲染1次，之后每一个 setTimeout 中修改一次响应式数据就会渲染1次。

>参考答案：
>
>**代码一（同步赋值）**
>
>会渲染两次：
>
>1. 初始化渲染一次：在组件挂载时，Vue 会进行一次初始渲染，将 rCount 的初始值 0 渲染到 DOM 中。
>
>2. 响应式数据更新和批处理：
>
>  - 在 for 循环中，rCount.value 被依次赋值为 1, 2, 3, 4, 5.  每次赋值时，Vue 的响应式系统会检测到数据的变化。
>  - 然而，这些变化发生在同一个同步代码块内，Vue 会将这些变化推入异步更新队列中。因为这些赋值操作是同步执行的，Vue 会在当前事件循环结束时对这些变化进行批处理（batching）
>  - Vue 的批处理机制会将这些同步的更改**合并为一次更新**，因此，无论有多少次对 rCount.value 的赋值，最终只会在异步队列中触发一次渲染更新。
>
>3. 最终渲染一次：由于 Vue 的批处理机制，这段代码最终只会触发 一次 DOM 更新，渲染出 rCount 的最终值 5.
>
>总计渲染次数：2 次（初始化渲染 1 次 + 批处理渲染 1 次）
>
>**代码二（异步赋值）**
>
>会渲染六次：
>
>1. 初始化渲染一次：同样，组件挂载时会进行一次初始渲染，将 rCount 的初始值 0 渲染到 DOM 中。
>
>2. 异步更新渲染：
>
>  - 在 for 循环中，每次迭代都会创建一个 setTimeout，每个 setTimeout 会在 0 毫秒后异步执行。在每个 setTimeout 的回调中，rCount.value 被依次赋值为 1, 2, 3, 4, 5
>  - 由于每次赋值都发生在一个独立的异步回调中，Vue 的响应式系统会在每个异步回调执行后，立即触发相应的更新流程。每次 setTimeout 回调都会使 rCount.value 发生变化，因此每次都需要进行一次渲染更新。
>
>3. 每个异步回调导致一次渲染：因此，这段代码会触发 5 次 DOM 更新，每次将 rCount 渲染为 1 到 5.
>
>总计渲染次数：6 次（初始化渲染 1 次 + 5 次异步更新渲染）

---

-EOF-

# Vue运行机制

>面试题：介绍一下 Vue3 内部的运行机制是怎样的？

Vue3 整体可以分为几大核心模块：

- 响应式系统
- 编译器
- 渲染器



**如何描述UI**

思考🤔：UI涉及到的信息有哪些？

1. DOM元素
2. 属性
3. 事件
4. 元素的层次结构

思考🤔：如何在 JS 中描述这些信息？

考虑使用对象来描述上面的信息

```html
<h1 id='title' @click=handler><span>hello</span></h1>
```

```js
const obj = {
  tag: 'h1',
  props: {
    id: 'title',
    onClick: handler
  },
  children: [
    {
      tag: 'span',
      children: 'hello'
    }
  ]
}
```

虽然这种方式能够描述出来 UI，但是非常麻烦，因此 Vue 提供了模板的方式。

用户书写模板----> 编译器 ----> 渲染函数 ----> 渲染函数执行得到上面的 JS 对象（虚拟DOM）

虽然大多数时候，模板比 JS 对象更加直观，但是偶尔有一些场景，JS 的方式更加灵活

```vue
<h1 v-if="level === 1"></h1>
<h2 v-else-if="level === 2"></h2>
<h3 v-else-if="level === 3"></h3>
<h4 v-else-if="level === 4"></h4>
<h5 v-else-if="level === 5"></h5>
<h6 v-else-if="level === 6"></h6>
```

```js
let level = 1;
const title = {
  tag: `h${level}`
}
```



**编译器**

主要负责将开发者所书写的**模板转换为渲染函数**。例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

编译后的结果为：

```js
function render(){
  return h('div', [
    h('h1', {id: someId}, 'Hello')
  ])
}
```

执行渲染函数，就会得到 JS 对象形式的 UI 表达。

整体来讲，整个编译过程如下图所示：

![image-20231113095532166](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-015532.png)

可以看到，在编译器的内部，实际上又分为了：

- 解析器：负责将模板解析为对应的模板 AST（抽象语法树）
- 转换器：负责将模板AST转换为 JS AST
- 生成器：将 JS AST 生成对应的 JS 代码（渲染函数）

Vue3 的编译器，除了最基本的编译以外，还做了很多的优化：

1. 静态提升
2. 预字符串化
3. 缓存事件处理函数
4. Block Tree
5. PatchFlag



**渲染器**

执行渲染函数得到的就是虚拟 DOM，也就是像这样的 JS 对象，里面包含着 UI 的描述信息

```html
<div>点击</div>
```

```js
const vnode = {
  tag: 'div',
  props: {
    onClick: ()=> alert('hello')
  },
  children: '点击'
}
```

渲染器拿到这个虚拟 DOM 后，就会将其转换为真实的 DOM

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-01-094219.png" alt="image-20240901174218998" style="zoom:50%;" />

一个简易版渲染器的实现思路：

1. 创建元素
2. 为元素添加属性和事件
3. 处理children

```js
function renderer(vnode, container){
  // 1. 创建元素
	const el = document.createElement(vnode.tag);
  // 2. 遍历 props，为元素添加属性
  for (const key in vnode.props) {
    if (/^on/.test(key)) {
      // 如果 key 以 on 开头，说明它是事件
      el.addEventListener(
        key.substr(2).toLowerCase(), // 事件名称 onClick --->click
        vnode.props[key] // 事件处理函数
      );
    }
  }
  // 3. 处理children
  if(typeof vnode.children === 'string'){
    el.appendChild(document.createTextNode(vnode.children))
  } else if(Array.isArray(vnode.children)) {
    // 递归的调用 renderer
    vnode.children.forEach(child => renderer(child, el))
  }
  
  container.appendChild(el)
}
```



**组件的本质**

组件本质就是**一组 DOM 元素**的封装。

假设函数代表一个组件：

```js
// 这个函数就可以当作是一个组件
const MyComponent = function () {
  return {
    tag: "div",
    props: {
      onClick: () => alert("hello"),
    },
    children: "click me",
  };
};
```

vnode 的 tag 就不再局限于 html 元素，而是可以写作这个函数名：

```js
const vnode = {
  tag: MyComponent
}
```

渲染器需要新增针对这种 tag 类型的处理：

```js
function renderer(vnode, container) {
  if (typeof vnode.tag === "string") {
    // 说明 vnode 描述的是标签元素
    mountElement(vnode, container);
  } else if (typeof vnode.tag === "function") {
    // 说明 vnode 描述的是组件
    mountComponent(vnode, container);
  }
}
```

组件也可以使用对象的形式：

```js
const MyComponent = {
  render(){
    return {
      tag: "div",
      props: {
        onClick: () => alert("hello"),
      },
      children: "click me",
  	};
  }
}
```

```js
function renderer(vnode, container) {
  if (typeof vnode.tag === "string") {
    // 说明 vnode 描述的是标签元素
    mountElement(vnode, container);
  } else if (typeof vnode.tag === "object") {
    // 说明 vnode 描述的是组件
    mountComponent(vnode, container);
  }
}
```



**响应式系统**

总结：当模板编译成的渲染函数执行时，渲染函数内部用到的响应式数据会和渲染函数本身构成依赖关系，之后只要响应式数据发生变化，渲染函数就会重新执行。



> 面试题：介绍一下 Vue3 内部的运行机制是怎样的？
>
> 参考答案：
>
> Vue3 是一个声明式的框架。声明式的好处在于，它直接描述结果，用户不需要关注过程。Vue.js 采用模板的方式来描述 UI，但它同样支持使用虚拟 DOM 来描述 UI。**虚拟 DOM 要比模板更加灵活，但模板要比虚拟 DOM 更加直观**。
>
> 当用户使用模板来描述 UI 的时候，内部的 **编译器** 会将其编译为渲染函数，渲染函数执行后能够确定响应式数据和渲染函数之间的依赖关系，之后响应式数据一变化，渲染函数就会重新执行。
>
> 渲染函数执行的结果是得到虚拟 DOM，之后就需要 **渲染器** 来将虚拟 DOM 对象渲染为真实 DOM 元素。它的工作原理是，递归地遍历虚拟 DOM 对象，并调用原生 DOM API 来完成真实 DOM 的创建。渲染器的精髓在于后续的更新，它会通过 Diff 算法找出变更点，并且只会更新需要更新的内容。
>
> 编译器、渲染器、响应式系统都是 Vue 内部的核心模块，它们共同构成一个有机的整体，不同模块之间互相配合，进一步提升框架性能。

---

-EOF-

# 渲染器核心功能

>面试题：说一说渲染器的核心功能是什么？

渲染器的核心功能，是根据拿到的 vnode，进行节点的**挂载**与**更新**。



**挂载属性**

vnode：

```js
const vnode = {
  type: 'div',
  // props 对应的就是节点的属性
  props: {
    id: 'foo'
  },
  children: [
    type: 'p',
    children: 'hello'
  ]
}
```

渲染器内部有一个 mountElement 方法：

```js
function mountElement(vnode, container){
  // 根据节点类型创建对应的DOM节点
  const el = document.createElement(vnode.type);
  
  // 省略children的处理
  
  // 对属性的处理
  if(vnode.props){
    for(const key in vnode.props){
      el.setAttribute(key, vnode.props[key])
    }
  }
  
  insert(el, container);
}
```

除了使用setAttribute方法来设置属性以外，也可以使用DOM对象的方式：

```js
if(vnode.props){
  for(const key in vnode.props){
    // el.setAttribute(key, vnode.props[key])
    el[key] = vnode.props[key];
  }
}
```

思考🤔：哪种设置方法好？两种设置方法有区别吗？应该使用哪种来设置？



**HTML Attributes**

Attributes 是元素的**初始**属性值，在 HTML 标签中定义，用于**描述元素的初始状态**。

- 在元素被解析的时候，只会初始化一次
- 只能是字符串值，而且这个值仅代表初始的状态，无法反应运行时的变化

```vue
<input type="text" id="username" value="John">
```

**DOM Properties**

Properties 是 JavaScript 对象上的属性，代表了 DOM 元素在 **内存中** 的实际状态。

- 反应的是 DOM 元素的当前状态
- 属性类型可以是字符串、数字、布尔值、对象之类的

很多 HTML attributes 在 DOM 对象上有与之相同的 DOM Properties，例如：

| HTML attributes | DOM properties |
| --------------- | -------------- |
| id="username"   | el.id          |
| type="text"     | el.type        |
| value="John"    | el.value       |

但是，两者并不总是相等的，例如：

| HTML attributes | DOM properties |
| --------------- | -------------- |
| class="foo"     | el.className   |

还有很多其他的情况：

- HTML attributes 有但是 DOM properties 没有的属性：例如 aria-* 之类的HTML Attributes
- DOM properties 有但是 HTML attributes 没有的属性：例如 el.textContent
- 一个 HTML attributes 关联多个 DOM properties 的情况:例如 value="xxx" 和 el.value 以及 el.defaultValue 都有关联

另外，在设置的时候，不是单纯的用某一种方式，而是两种方式结合使用。因为需要考虑很多特殊情况：

1. disabled
2. 只读属性

**1. disabled**

模板：我们想要渲染的按钮是非禁用状态

```vue
<button :disabled="false">Button</button>
```

vnode:

```js
const vnode = {
  type: 'button',
  props: {
    disable: false
  }
}
```

通过 el.setAttribute 方法来进行设置会遇到的问题：最终渲染出来的按钮就是禁用状态

```js
 el.setAttribute('disabled', 'false')
```

解决方案：优先设置 DOM Properties

遇到新的问题：本意是要禁用按钮

```vue
<button disabled>Button</button>
```

```js
const vnode = {
  type: 'button',
  props: {
    disable: ''
  }
}
```

```js
el.disabled = ''
```

在对 DOM 的 disabled 属性设置值的时候，任何非布尔类型的值都会被转为布尔类型：

```js
el.disabled = false
```

最终渲染出来的按钮是非禁用状态。



**渲染器内部的实现，不是单独用 HTML Attribute 或者 DOM Properties，而是两者结合起来使用，并且还会考虑很多的细节以及特殊情况，针对特殊情况做特殊处理**。

```js
function mountElement(vnode, container) {
  const el = createElement(vnode.type);
  // 省略 children 的处理

  if (vnode.props) {
    for (const key in vnode.props) {
      // 用 in 操作符判断 key 是否存在对应的 DOM Properties
      if (key in el) {
        // 获取该 DOM Properties 的类型
        const type = typeof el[key];
        const value = vnode.props[key];
        // 如果是布尔类型，并且 value 是空字符串，则将值矫正为 true
        if (type === "boolean" && value === "") {
          el[key] = true;
        } else {
          el[key] = value;
        }
      } else {
        // 如果要设置的属性没有对应的 DOM Properties，则使用 setAttribute 函数设置属性
        el.setAttribute(key, vnode.props[key]);
      }
    }
  }
  insert(el, container);
}
```

**2. 只读属性**

```vue
<input form="form1"/>
```

例如 el.form，但是这个属性是只读的，所以这种情况，又只能使用 setAttribute 方法来设置

```js
function shouldSetAsProps(el, key, value) {
  // 特殊处理
  // 遇到其他特殊情况再进行重构
  if (key === "form" && el.tagName === "INPUT") return false;
  // 兜底
  return key in el;
}

function mountElement(vnode, container) {
  const el = createElement(vnode.type);
  // 省略 children 的处理

  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key];

      if (shouldSetAsProps(el, key, value)) {
        const type = typeof el[key];
        if (type === "boolean" && value === "") {
          el[key] = true;
        } else {
          el[key] = value;
        }
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  insert(el, container);
}
```

shouldSetAsProps 这个方法返回一个布尔值，由布尔值来决定是否使用 DOM Properties 来设置。

还可以进一步优化，将属性的设置提取出来：

```js
function shouldSetAsProps(el, key, value) {
  // 特殊处理
  if (key === "form" && el.tagName === "INPUT") return false;
  // 兜底
  return key in el;
}

/**
 *
 * @param {*} el 元素
 * @param {*} key 属性
 * @param {*} prevValue 旧值
 * @param {*} nextValue 新值
 */
function patchProps(el, key, prevValue, nextValue) {
  if (shouldSetAsProps(el, key, nextValue)) {
    const type = typeof el[key];
    if (type === "boolean" && nextValue === "") {
      el[key] = true;
    } else {
      el[key] = nextValue;
    }
  } else {
    el.setAttribute(key, nextValue);
  }
}

function mountElement(vnode, container) {
  const el = createElement(vnode.type);
  // 省略 children 的处理

  if (vnode.props) {
    for (const key in vnode.props) {
      // 调用 patchProps 函数即可
      patchProps(el, key, null, vnode.props[key]);
    }
  }
  insert(el, container);
}
```



**class处理**

class 本质上也是属性的一种，但是在 Vue 中针对 class 做了增强，因此 Vue 模板中的 class 的值可能会有这么一些情况：

情况一：字符串值

```vue
<template>
	<p class="foo bar"></p>
</template>
```

```js
const vnode = {
  type: "p",
  props: {
    class: "foo bar",
  },
};
```

情况二：对象值

```vue
<template>
	<p :class="cls"></p>
</template>
<script setup>
import { ref } from 'vue'
const cls = ref({
  foo: true,
  bar: false
})
</script>
```

```js
const vnode = {
  type: "p",
  props: {
    class: { foo: true, bar: false },
  },
};
```

情况三：数组值

```vue
<template>
	<p :class="arr"></p>
</template>
<script setup>
import { ref } from 'vue'
const arr = ref([
  'foo bar',
  {
    baz: true
  }
])
</script>
```

```js
const vnode = {
  type: "p",
  props: {
    class: ["foo bar", { baz: true }],
  },
};
```

这里首先第一步就是需要做参数归一化，统一成字符串类型。Vue内部有一个方法 normalizeClass 就是做 class 的参数归一化的。

```js
function isString(value) {
  return typeof value === "string";
}

function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    // 如果是数组，递归调用 normalizeClass
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += (res ? " " : "") + normalized;
      }
    }
  } else if (isObject(value)) {
    // 如果是对象，则检查每个 key 是否为真值
    for (const name in value) {
      if (value[name]) {
        res += (res ? " " : "") + name;
      }
    }
  }
  return res;
}

console.log(normalizeClass("foo")); // 'foo'
console.log(normalizeClass(["foo", "bar"])); // 'foo bar'
console.log(normalizeClass({ foo: true, bar: false })); // 'foo'
console.log(normalizeClass(["foo", { bar: true }])); // 'foo bar'
console.log(normalizeClass(["foo", ["bar", "baz"]])); // 'foo bar baz'
```

```js
const vnode = {
  type: "p",
  props: {
    class: normalizeClass(["foo bar", { baz: true }]),
  },
};
```

```js
const vnode = {
  type: "p",
  props: {
    class: 'foo bar baz',
  },
};
```

设置class的时候，设置方法也有多种：

1. setAttribute
2. el.className：这种方式效率是最高的
3. el.classList

```js
function patchProps(el, key, prevValue, nextValue) {
  // 对 class 进行特殊处理
  if (key === "class") {
    el.className = nextValue || "";
  } else if (shouldSetAsProps(el, key, nextValue)) {
    const type = typeof el[key];
    if (type === "boolean" && nextValue === "") {
      el[key] = true;
    } else {
      el[key] = nextValue;
    }
  } else {
    el.setAttribute(key, nextValue);
  }
}
```



**子节点的挂载**

除了对自身节点的处理，还需要对子节点进行处理，不过处理子节点时涉及到 diff 计算。

```js
function mountElement(vnode, container) {
  const el = createElement(vnode.type);
  
  // 针对子节点进行处理
  if (typeof vnode.children === "string") {
    // 如果 children 是字符串，则直接将字符串插入到元素中
    setElementText(el, vnode.children);
  } else if (Array.isArray(vnode.children)) {
    // 如果 children 是数组，则遍历每一个子节点，并调用 patch 函数挂载它们
    vnode.children.forEach((child) => {
      patch(null, child, el);
    });
  }
  insert(el, container);
}
```



>面试题：说一说渲染器的核心功能是什么？
>
>参考答案：
>
>渲染器最最核心的功能是处理从虚拟 DOM 到真实 DOM 的渲染过程，这个过程包含几个阶段：
>
>1. 挂载：初次渲染时，渲染器会将虚拟 DOM 转化为真实 DOM 并插入页面。它会根据虚拟节点树递归创建 DOM 元素并设置相关属性。
>2. 更新：当组件的状态或属性变化时，渲染器会计算新旧虚拟 DOM 的差异，并通过 Patch 过程最小化更新真实 DOM。
>3. 卸载：当组件被销毁时，渲染器需要将其从 DOM 中移除，并进行必要的清理工作。
>
>每一个步骤都有大量需要考虑的细节，就拿挂载来讲，光是处理元素属性如何挂载就有很多需要考虑的问题，比如：
>
>1. 最终设置属性的时候是用 setAttribute 方法来设置，还是用给 DOM 对象属性赋值的方式来设置
>2. 遇到像 disabled 这样的特殊属性该如何处理
>3. class、style 这样的多值类型，该如何做参数的归一化，归一为哪种形式
>4. 像 class 这样的属性，设置的方式有哪种，哪一种效率高
>
>另外，渲染器和响应式系统是紧密结合在一次的，当组件首次渲染的时候，组件里面的响应式数据会和渲染函数建立依赖关系，当响应式数据发生变化后，渲染函数会重新执行，生成新的虚拟 DOM 树，渲染器随即进入更新阶段，根据新旧两颗虚拟 DOM 树对比来最小化更新真实 DOM，这涉及到了 Vue 中的 diff 算法。diff 算法这一块儿，Vue2 采用的是双端 diff，Vue3 则是做了进一步的优化，采用的是快速 diff 算法。diff 这一块儿需要我展开说一下么？

---

-EOF-

# 事件绑定与更新

>面试题：说一下 Vue 内部是如何绑定和更新事件的？

```vue
<p @click="clickHandler">text</p>
```

对应的 vnode 如下：

```js
const vnode = {
  type: 'p',
  props: {
    // 事件其实就是一种特殊的属性，放置于props里面
    onClick: ()=>{ 
      // ...
    }
  },
  children: 'text'
}
```

所以在渲染器内部可以检测以 on 开头的属性，说明就是事件，例如：

```js
function renderer(vnode, container) {
  // 使用 vnode.tag 作为标签名称创建 DOM 元素
  const el = document.createElement(vnode.tag);
  // 遍历 vnode.props，将属性、事件添加到 DOM 元素
  for (const key in vnode.props) {
    if(/^on/.test(key)){
      // 说明是事件
      el.addEventListenser(
      	key.substr(2).toLowerCase(), // 事件名称 onClick --> click
        vnode.props[key]
      )
    }
  }

  // 处理 children
  if (typeof vnode.children === "string") {
    // 如果 children 是字符串，说明它是元素的文本子节点
    el.appendChild(document.createTextNode(vnode.children));
  } else if (Array.isArray(vnode.children)) {
    // 递归地调用 renderer 函数渲染子节点，使用当前元素 el 作为挂载点
    vnode.children.forEach((child) => renderer(child, el));
  }

  // 将元素添加到挂载点下
  container.appendChild(el);
}
```

不过在 Vue 源码中，渲染器内部其实有一个 patchProps 方法:

```js
function patchProps(el, key, prevValue, nextValue){
  if(/^on/.test{key}){
   	// 说明是事件，做事件的绑定操作
    const name = key.substr(2).toLowerCase(); // 事件名称 onClick --> click
   	el.addEventListenser(name, vnode.props[key])
  } else if(key === 'class'){
    // ...
  } else if( 
    //... 
  ){
    // ...
  }
}
```

如果涉及到事件的更新，则需要先把上一次的**事件卸载**掉，然后绑定新的事件：

```js
function patchProps(el, key, prevValue, nextValue){
  if(/^on/.test{key}){
    // 说明是事件，做事件的绑定操作
    const name = key.substr(2).toLowerCase(); // 事件名称 onClick --> click
    // 移除上一次绑定的事件
    prevValue && el.removeEventListenser(name, prevValue);
    // 再来绑定新的事件处理函数
   	el.addEventListenser(name, vnode.props[key])
  } else if(key === 'class'){
    // ...
  } else if( 
    //... 
  ){
    // ...
  }
}
```

上面的方式虽然能够正常工作，但是会涉及到反复的绑定和卸载事件。

一种更加优雅的方式是将事件处理器作为一个对象的属性，之后只要更新该对象的属性即可。

```js
function patchProps(el, key, prevValue, nextValue){
  if(/^on/.test{key}){
    // 说明是事件，做事件的绑定操作
    const name = key.substr(2).toLowerCase(); // 事件名称 onClick --> click
    // 这是一个自定义的属性，回头会被赋值为一个函数，该函数会作为事件处理函数
    let invoker = el._eventHandler; 
    if(nextValue){
      // 说明有新的事件处理函数
      // 这里又有两种情况：1. 第一次绑定事件（事件的初始化）2.非第一次（事件的更新）
      if(!invoker){
        // 事件的初始化
        invoker = el._eventHandler = (e)=>{
          // 执行真正的事件处理函数
          invoker.value(e)
        }
        // 将新的事件处理函数挂载 invoker 的 value 属性上面
        invoker.value = nextValue;
        // 因此是第一次，需要做事件的挂载
        el.addEventListenser(name, invoker)
      } else {
        // 事件的更新
        // 更新的时候不需要再像之前一样先卸载事件，直接更新invoker的value属性值即可
        invoker.value = nextValue;
      }
    } else {
      // 新的事件处理器不存在，那么就需要卸载旧的事件处理器
      el.removeEventListenser(name, invoker);
    }
  } else if(key === 'class'){
    // ...
  } else if( 
    //... 
  ){
    // ...
  }
}
```

不过目前仍然有问题，同一时刻只能缓存一个事件处理函数，而一个元素其实是可以绑定多种事件的，例如：

```js
const vnode = {
  type: 'p',
  props: {
    onClick: ()=>{ 
      // ...
    },
    onContextmenu: ()=>{
      // ...
    }
  },
  children: 'text'
}
```

把 el._eventHandler 由对应的一个函数改为一个对象，对象的键就是事件的名称，对象的值则是对应的事件处理函数：

```js
function patchProps(el, key, prevValue, nextValue){
  if(/^on/.test{key}){
    // 说明是事件，做事件的绑定操作
    const name = key.substr(2).toLowerCase(); // 事件名称 onClick --> click
    // 这是一个自定义的属性，回头会被赋值为一个函数，该函数会作为事件处理函数
    const invokers = el._eventHandler || (el._eventHandler = {})
    let invoker = invokers[key]; 
    if(nextValue){
      // 说明有新的事件处理函数
      // 这里又有两种情况：1. 第一次绑定事件（事件的初始化）2.非第一次（事件的更新）
      if(!invoker){
        // 事件的初始化
        invoker = el._eventHandler[key] = (e)=>{
          // 执行真正的事件处理函数
          invoker.value(e)
        }
        // 将新的事件处理函数挂载 invoker 的 value 属性上面
        invoker.value = nextValue;
        // 因此是第一次，需要做事件的挂载
        el.addEventListenser(name, invoker)
      } else {
        // 事件的更新
        // 更新的时候不需要再像之前一样先卸载事件，直接更新invoker的value属性值即可
        invoker.value = nextValue;
      }
    } else {
      // 新的事件处理器不存在，那么就需要卸载旧的事件处理器
      el.removeEventListenser(name, invoker);
    }
  } else if(key === 'class'){
    // ...
  } else if( 
    //... 
  ){
    // ...
  }
}
```

另外还有一种情况我们需要解决，那就是同种事件类型绑定多个事件处理函数的情况，例如：

```js
el.addEventListener('click', fn1);
el.addEventListener('click', fn2);
```

```js
// 对应的 vnode 结构
const vnode = {
  type: 'p',
  props: {
     // 事件其实就是一种特殊的属性，放置于props里面
    onClick: [
      ()=>{},
      ()=>{}
    ]
  },
  children: 'text'
}
```

```js
function patchProps(el, key, prevValue, nextValue){
  if(/^on/.test{key}){
    // 说明是事件，做事件的绑定操作
    const name = key.substr(2).toLowerCase(); // 事件名称 onClick --> click
    // 这是一个自定义的属性，回头会被赋值为一个函数，该函数会作为事件处理函数
    const invokers = el._eventHandler || (el._eventHandler = {})
    let invoker = invokers[key]; 
    if(nextValue){
      // 说明有新的事件处理函数
      // 这里又有两种情况：1. 第一次绑定事件（事件的初始化）2.非第一次（事件的更新）
      if(!invoker){
        // 事件的初始化
        invoker = el._eventHandler[key] = (e)=>{
          // 这里需要进行判断，判断是否为数组，如果是数组，说明有多个事件处理函数
          if(Array.isArray(invoker.value)){
            invoker.value.forEach(fn=>fn(e))
          } else {
            // 执行真正的事件处理函数
          	invoker.value(e)
          }
        }
        // 将新的事件处理函数挂载 invoker 的 value 属性上面
        invoker.value = nextValue;
        // 因此是第一次，需要做事件的挂载
        el.addEventListenser(name, invoker)
      } else {
        // 事件的更新
        // 更新的时候不需要再像之前一样先卸载事件，直接更新invoker的value属性值即可
        invoker.value = nextValue;
      }
    } else {
      // 新的事件处理器不存在，那么就需要卸载旧的事件处理器
      el.removeEventListenser(name, invoker);
    }
  } else if(key === 'class'){
    // ...
  } else if( 
    //... 
  ){
    // ...
  }
}
```



>面试题：说一下 Vue 内部是如何绑定和更新事件的？
>
>参考答案：
>
>开发者在模板中书写事件绑定：
>
>```vue
><p @click='clickHandler'>text</p>
>```
>
>模板被编译器编译后会生成渲染函数，渲染函数的执行得到的是虚拟 DOM.
>
>事件在虚拟 DOM 中其实就是以 Props 的形式存在的。在渲染器内部，会有一个专门针对 Props 进行处理的方法，当遇到以 on 开头的 Prop 时候，会认为这是一个事件，从而进行事件的绑定操作。
>
>为了避免事件更新时频繁的卸载旧事件，绑定新事件所带来的性能消耗，Vue 内部将事件作为一个对象的属性，更新事件的时候只需要更新对象的属性值即可。该对象的结构大致为：
>
>```js
>{
> onClick: [
>     ()=>{},
>     ()=>{},
> ],
> onContextmenu: ()=>{}
> // ...
>}
>```
>
>这种结构能做到：
>
>1. 一个元素绑定多种事件
>2. 支持同种事件类型绑定多个事件处理函数

---

-EOF-

# computed面试题

>面试题：谈谈 computed 的机制，缓存了什么？为什么 computed 不支持异步？

响应式系统：

- track：进行依赖收集，建立数据和函数的映射关系
- trigger：触发更新，重新执行数据所映射的所有函数

computed开发者使用：

```js
const state = reactive({
  a: 1,
  b: 2
})

const sum = computed(() => {
  return state.a + state.b
})
```

```js
const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  get() {
    return firstName.value + ' ' + lastName.value
  },
  set(newValue) {
    ;[firstName.value, lastName.value] = newValue.split(' ')
  }
})
```

computed核心实现：

1. 参数归一化，统一成对象的形式
2. 返回一个存取器对象

```js
import { effect } from "./effect/effect.js";
import track from "./effect/track.js";
import trigger from "./effect/trigger.js";
import { TriggerOpTypes, TrackOpTypes } from "./utils.js";

// 参数归一化
function normalizeParameter(getterOrOptions) {
  // 代码略
}

/**
 *
 * @param {*} getterOrOptions 可能是函数，也可能是对象
 */
export function computed(getterOrOptions) {
  // 1. 参数归一化
  const {getter, setter} = normalizeParameter(getterOrOptions);
  
  // value 用于存储计算结果， dirty 负责控制从缓存中获取值还是重新计算新的值，dirty为true就代表要重新计算
  let value, dirty = true;
  
  // 让getter内部的响应式数据和getter建立映射关系
  // 回头getter内部的响应式数据发生变化后，重新执行getter
  const effectFn = effect(getter, {
    lazy: true,
    scheduler(){
      dirty = true;
      trigger(obj, TriggerOpTypes.SET, "value")
    }
  })
  
  
  // 2. 返回一个存取器对象
  const obj = {
    get value(){
      // 需要将 value 和渲染函数建立映射关系
      track(obj, TrackOpTypes.GET, "value")
      if(dirty){
        value = effectFn()
        dirty = false;
      }
      return value;
    },
    set value(newValue){
      setter(newValue)
    }
  }
  return obj;
}
```



> 面试题：谈谈 computed 的机制，缓存了什么？为什么 computed 不支持异步？
>
> 参考答案：
>
> **谈谈 computed 的机制，缓存了什么？**
>
> 缓存的是上一次 getter 计算出来的值。
>
> **为什么 computed 不支持异步？**
>
> computed 属性在 Vue 中不支持异步操作的主要原因是设计上的理念和使用场景的考虑。**computed 属性的初衷是用于计算并缓存一个基于响应式依赖的同步计算结果**，当其依赖的响应式数据发生变化时，Vue 会自动重新计算 computed 的值，并将其缓存，以提高性能。
>
> computed 不支持异步的几个具体原因：
>
> 1. 缓存机制与同步计算：computed 属性的一个核心特性是缓存。当依赖的响应式数据没有变化时，computed 的计算结果会被缓存并直接返回，而不会重新执行计算。这种缓存机制是基于同步计算的，假如允许异步计算，那么在异步操作完成之前，computed 属性无法提供有效的返回值，这与它的同步缓存理念相违背。
> 2. 数据一致性：computed 属性通常用于模板中的绑定，它的计算结果需要在渲染期间是稳定且可用的。如果 computed 支持异步操作，渲染过程中的数据可能不一致，会导致模板渲染时无法确定使用什么数据，从而可能造成视图的闪烁或数据错误。
> 3. 调试与依赖追踪困难：如果 computed 属性是异步的，那么在调试和依赖追踪时就会变得非常复杂。异步操作的完成时间不确定，会使得依赖追踪的过程变得不直观，也难以预期。
>
> 如果需要进行异步操作，通常推荐使用 watch 来实现。

---

-EOF-

# watch面试题

>面试题：watch 和 computed 的区别是什么？说一说各自的使用场景？

watch的使用

```js
const count = ref('');
watch(count, async (newVal, oldVal)=>{})

watch(()=>{
  count...
}, (newVal, oldVal)=>{
  // ...
})
```

watch核心实现

```js
import { effect, cleanup } from "./effect/effect.js";

// 遍历对象
function traverse(value, seen = new Set()) {
  // ...
}

/**
 * @param {*} source 
 * @param {*} cb 要执行的回调函数
 * @param {*} options 选项对象
 * @returns
 */
export function watch(source, cb, options = {}) {
  // 1. 参数归一化，统一成一个函数
  let getter;
  if(typeof source === 'function'){
    getter = source;
  } else {
    getter = () => traverse(source)
  }
  
  // 2. 保存新值和旧值
  let oldValue, newValue;
  
  const effectFn = effect(()=>getter(), {
    lazy: true,
    scheduler: ()=>{
      newValue = effectFn();
      cb(newValue, oldValue)
      oldValue = newValue
    }
  })
  
  oldValue = effectFn()
  
  return ()=>{
    cleanup(effectFn)
  }
}
```



> 面试题：watch 和 computed 的区别是什么？说一说各自的使用场景？
>
> 参考答案：
>
> **computed**
>
> - 作用：用于创建计算属性，依赖于 Vue 的响应式系统来做数据追踪。当依赖的数据发生变化时，会自动重新计算。
> - 无副作用：计算属性内部的计算应当是没有副作用的，也就是说仅仅基于数据做二次计算。
> - 缓存：计算属性具备缓存机制，如果响应式数据没变，每次获取计算属性时，内部直接返回的是上一次计算值。
> - 用处：通常用于模板当中，以便在模板中显示二次计算后的结构。
> - 同步：计算属性的一个核心特性是缓存，而这种缓存机制是基于同步计算的，假如允许异步计算，那么在异步操作完成之前，计算属性无法提供有效的返回值，这与它的缓存设计理念相违背。
>
> **watch**
>
> - 作用：用于监听数据的变化，可以监听一个或者多个数据，当数据发生改变时，执行一些用户指定的操作。
> - 副作用：监听器中的回调函数可以执行副作用操作，例如发送网络请求、手动操作 DOM 等。
> - 无缓存：监听器中的回调函数执行结果不会被缓存，也没办法缓存，因为不知道用户究竟要执行什么操作，有可能是包含副作用的操作，有可能是不包含副作用的操作。
> - 用处：常用于响应式数据发生变化后，重新发送网络请求，或者修改 DOM 元素等场景。
> - 支持异步：在监听到响应式数据发生变化后，可以进行同步或者异步的操作。

---

-EOF-

# 图解双端diff

>面试题：说一下 Vue3 中的 diff 相较于 Vue2 有什么变化？

- Vue2: 双端diff
- Vue3: 快速diff

**1. diff的概念**

diff 算法是用于比较两棵虚拟 DOM 树的算法，目的是找到它们之间的差异，并根据这些差异高效地更新真实 DOM，从而保证页面在数据变化时只进行**最小程度**的 DOM 操作。

思考🤔：为什么需要进行diff，不是已经有响应式了么？

答案：响应式虽然能够侦测到响应式数据的变化，但是只能定位到组件，代表着某一个组件要重新渲染。组件的重新渲染就是重新执行对应的渲染函数，此时就会生成新的虚拟 DOM 树。但是此时我们并不知道新树和旧树具体哪一个节点有区别，这个时候就需要diff算法来找到两棵树的区别。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-06-013616.png" alt="20210301193804" style="zoom: 60%;" />

**2. diff算法的特点**

1. 分层对比：它会逐层对比每个节点和它的子节点，避免全树对比，从而提高效率。
2. 相同层级节点对比：在进行 diff 对比的时候，Vue会假设对比的节点是同层级的，也就是说，不会做跨层的比较。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-06-013054.png" alt="20210301203350" style="zoom:65%;" />

**3. diff算法详细流程**

1. 从根节点开始比较，看是否**相同**。所谓相同，是指两个虚拟节点的**标签类型**、**key 值**均相同，但 **input 元素还要看 type 属性**

   1. 相同
      - 相同就说明能够复用，此时就会将旧虚拟DOM节点对应的真实DOM赋值给新虚拟DOM节点
      - 对比新节点和旧节点的属性，如果属性有变化更新到真实DOM. 这说明了即便是对 DOM 进行复用，也不是完全不处理，还是会有一些针对属性变化的处理
      - 进入【对比子节点】
   2. 不相同
      - 如果不同，该节点以及往下的子节点没有意义了，全部卸载
        - 直接根据新虚拟DOM节点递归创建真实DOM，同时挂载到新虚拟DOM节点
        - 销毁旧虚拟DOM对应的真实DOM，背后调用的是 vnode.elm.remove( ) 方法

2. 对比子节点：

   1. 仍然是同层做对比
   2. 深度优先
   3. 同层比较时采用的是双端对比

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-06-021144.png" alt="image-20240906101143754" style="zoom:70%;" />



**4. 双端对比**

之所以被称之为双端，是因为有**两个**指针，一个指向头节点，另一个指向尾节点，如下所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-13-145148.png" alt="image-20240913225147579" style="zoom:50%;" />

无论是旧的虚拟 DOM 列表，还是新的虚拟 DOM 列表，都是一头一尾两个指针。

接下来进入比较环节，整体的流程为：

1. 步骤一：新头和旧头比较

   - 相同：

     - 复用 DOM 节点

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021542.png" alt="image-20240914101542039" style="zoom:50%;" />

     - 新旧头索引自增

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021629.png" alt="image-20240914101629244" style="zoom:50%;" />

     - 重新开始步骤一

   - 不相同：进入步骤二

2. 步骤二：新尾和旧尾比较

   - 相同：

     - 复用 DOM 节点

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021834.png" alt="image-20240914101834010" style="zoom:50%;" />

     - 新旧尾索引自减

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021914.png" alt="image-20240914101913347" style="zoom:50%;" />

     - 重新开始步骤一

   - 不相同，进入步骤三

3. 步骤三：旧头和新尾比较

   - 相同：

     - 说明可以复用，并且说明节点从头部移动到了尾部，涉及到移动操作，需要将旧头对应的 DOM 节点移动到旧尾对应的 DOM 节点之后

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021232.png" alt="image-20240914101231300" style="zoom:50%;" />

     - 旧头索引自增，新尾索引自减

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-021401.png" alt="image-20240914101400686" style="zoom:50%;" />

     - 重新开始步骤一

   - 不相同，进入步骤四

4. 步骤四：新头和旧尾比较

   - 相同：

     - 说明可以复用，并且说明节点从尾部移动到了头部，仍然涉及到移动操作，需要将旧尾对应的 DOM 元素移动到旧头对应的 DOM 节点之前

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-025559.png" alt="image-20240914105559210" style="zoom:50%;" />

     - 新头索引自增，旧尾索引自减

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-025649.png" alt="image-20240914105649208" style="zoom:50%;" />

     - 重新开始步骤一

   - 不相同：进入步骤五

5. 暴力比较：上面 4 个步骤都没找到相同的，则采取暴力比较。在旧节点列表中寻找是否有和新节点相同的节点，

   - 找到

     - 说明是一个需要移动的节点，将其对应的 DOM 节点移动到旧头对应的 DOM 节点之前

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-030013.png" alt="image-20240914110012627" style="zoom:50%;" />

     - 新头索引自增

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-030048.png" alt="image-20240914110048026" style="zoom:50%;" />

     - 回到步骤一

   - 没找到

     - 说明是一个新的节点，创建新的 DOM 节点，插入到旧头对应的 DOM 节点之前

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-030333.png" alt="image-20240914110332605" style="zoom:50%;" />

     - 新头索引自增

       <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-030401.png" alt="image-20240914110401233" style="zoom:50%;" />

     - 回到步骤一

新旧节点列表任意一个遍历结束，也就是 oldStart > OldEnd 或者 newStart > newEnd 的时候，diff 比较结束。

- 旧节点列表有剩余（newStart > newEnd）：对应的旧 DOM 节点全部删除掉
- 新节点列表有剩余（oldStart > OldEnd）：将新节点列表中剩余的节点创建对应的 DOM，放置于新头节点对应的 DOM 节点后面



**综合示例**

当前旧 Vnode 和新 VNode 如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-031038.png" alt="image-20240914111038061" style="zoom:50%;" />

1. 头头对比，能够复用，新旧头指针右移

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-031750.png" alt="image-20240914111750328" style="zoom:50%;" />

2. 头头不同，尾尾相同，能够复用，尾尾指针左移

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-031936.png" alt="image-20240914111936261" style="zoom:50%;" />

3. 头头不同，尾尾不同，旧头新尾相同，旧头对应的真实DOM移动到旧尾对应的真实DOM之后，旧头索引自增，新尾索引自减

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-032233.png" alt="image-20240914112233100" style="zoom:50%;" />

4. 头头不同，尾尾不同，旧头新尾不同，新头旧尾相同，旧尾对应的真实DOM移动到旧头对应的真实DOM之前，新头索引自增，旧尾索引自减

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-032710.png" alt="image-20240914112710405" style="zoom:50%;" />

5. 头头不同，尾尾不同，旧头新尾不同，新头旧尾不同，进入暴力对比，找到对应节点，将对应的真实DOM移动到旧头对应的真实DOM之间，新头索引自增

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-033001.png" alt="image-20240914113000896" style="zoom:50%;" />

6. 头头不同，尾尾不同，旧头新尾不同，新头旧尾相同，将旧尾对应的真实DOM移动到旧头对应的真实DOM之前，新头索引自增，旧尾索引自减

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-033248.png" alt="image-20240914113247844" style="zoom:50%;" />

7. 头头不同，尾尾不同，旧头新尾不同，新头旧尾不同，暴力对比发现也没找到，说明是一个全新的节点，创建新的DOM节点，插入到旧头对应的DOM节点之前，新头索引自增

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-033445.png" alt="image-20240914113444878" style="zoom:50%;" />

8. newEnd > newStart，diff 比对结束，旧 VNode 列表还有剩余，直接删除即可。

   <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-14-033722.png" alt="image-20240914113721337" style="zoom:50%;" />

---

-EOF-

# 最长递增子序列

**基本介绍**

最长递增子序列（Longest Increasing Subsequence，简称 LIS）是计算机科学中一个经典的算法问题。这看上去是很难的一个词语，遇到这种词，最简单的方法就是拆词，这里可以拆为 3 个词：**最长**、**递增**、**子序列**。

1. 子序列

   ```js
   [1, 2, 3, 4, 5]
   ```

   子序列有多个：

   ```js
   [1, 2, 3]
   [1, 3]
   [2, 4, 5]
   ```

2. 递增

   ```js
   [2, 1, 5, 3, 6, 4, 8, 9, 7]
   ```

   这个子序列里面的元素必须是递增的：

   ```js
   [1, 5] // 子序列，并且是递增的
   [1, 3, 6] // 子序列，并且是递增的
   [2, 1, 5] // 子序列，但是不是递增的
   ```

3. 最长

   相当于在上面的基础上，有增加了一个条件，需要是最长的、递增的子序列

   ```js
   [2, 1, 5, 3, 6, 4, 8, 9, 7]
   ```

   最长递增子序列：

   ```js
   [1, 3, 4, 8, 9]
   [1, 3, 6, 8, 9]
   [1, 5, 6, 8, 9]
   [2, 3, 4, 8, 9]
   [2, 3, 6, 8, 9]
   [2, 5, 6, 8, 9]
   ```

   可以看出，即便是最长递增子序列，仍然是可以有多个的。在开发中，不同的算法可能拿到不一样的结果，不过一般拿到其中一个最长递增子序列即可。

实际意义

- 股票趋势分析
- 手写识别
- 文本编辑和版本控制
- ....



**暴力法**

暴力法的核心思想是：找到所有的递增子序列，然后从中找到长度最长的那一个。

```js
function getSequence(arr) {
  let maxLength = 0; // 记录最长递增子序列的长度
  let longetSeq = []; // 记录最长递增子序列

  /**
   *
   * @param {*} index 列表的下标
   * @param {*} subSeq 当前递增子序列
   */
  function findSubsequence(index, subSeq) {
    let currentNum = arr[index]; // 当前元素
    // 先把之前的递增子序列展开，再加上当前元素
    let newSeq = [...subSeq, currentNum]; // 新的递增子序列

    // 遍历下标之后的内容
    for (let i = index + 1; i < arr.length; i++) {
      // 遍历当前下标之后的元素时，发现有比当前元素大的元素
      if (arr[i] > currentNum) {
        findSubsequence(i, newSeq);
      }
    }

    // 每一次递归结束后，就会得到一个新的递增子序列
    // 相当于找到了所有的递增子序列
    // console.log("newSeq:", newSeq);

    if (newSeq.length > maxLength) {
      maxLength = newSeq.length;
      longetSeq = newSeq;
    }
  }

  for (let i = 0; i < arr.length; i++) {
    findSubsequence(i, []);
  }

  return longetSeq;
}

const list = [2, 1, 5, 3, 6, 4, 8, 9, 7];
const result = getSequence(list);
console.log(result); // [2, 5, 6, 8, 9]
```



**动态规划**

动态规划（Dynamic Programming）的核心思想是利用问题的**最优子结构**和**重叠子问题**特性，将复杂问题分解为更小的子问题，并且在解决这些子问题的时候会保存子问题的解，避免重复计算，从而高效地求解原问题。

```js
function getSequence(arr) {
  let maxLength = 0; // 记录最长递增子序列的长度
  let maxSeq = []; // 记录最长递增子序列

  let sequences = new Array(arr.length).fill().map(() => []);

  //   console.log(sequences);

  // 遍历数组
  for (let i = 0; i < arr.length; i++) {
    // 创建一个以当前元素为结尾的递增子序列
    let seq = [arr[i]];
    // 遍历之前的元素，找到比当前元素小的元素，从而构建递增子序列
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i]) {
        // 把之前存储的序列和当前元素拼接起来
        seq = sequences[j].concat(arr[i]);
      }
    }

    // 将当前递增子序列存储起来
    sequences[i] = seq;

    // 更新最大的序列
    if (seq.length > maxLength) {
      maxLength = seq.length;
      maxSeq = seq;
    }
  }
  //   console.log(sequences);
  return maxSeq;
}

const list = [2, 1, 5, 3, 6, 4, 8, 9, 7];
const result = getSequence(list);
console.log(result); // [ 1, 3, 4, 8, 9 ]
```



**Vue3中的算法**

Vue3 中获取最长递增子序列，用到了 **贪心** 和 **二分** 查找。

```js
function getSequence(arr) {
  // 用于记录每个位置的前驱索引，以便最后重建序列
  const p = arr.slice();
  // 存储当前找到的最长递增子序列的索引
  const result = [0];
  // 声明循环变量和辅助变量
  let i, j, u, v, c;
  // 获取输入数组的长度
  const len = arr.length;
  // 遍历输入数组
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    // 忽略值为 0 的元素（Vue源码中的diff算法对0有特定处理）
    if (arrI !== 0) {
      // 获取当前最长序列中最后一个元素的索引
      j = result[result.length - 1];
      // 贪心算法部分：如果当前元素大于当前最长序列的最后一个元素，直接添加
      if (arr[j] < arrI) {
        // 记录当前元素的前驱索引为 j
        p[i] = j;
        // 将当前元素的索引添加到 result 中
        result.push(i);
        continue;
      }
      // 二分查找部分：在 result 中寻找第一个大于等于 arrI 的元素位置
      u = 0;
      v = result.length - 1;
      while (u < v) {
        // 取中间位置
        c = ((u + v) / 2) | 0;
        // 比较中间位置的值与当前值
        if (arr[result[c]] < arrI) {
          // 如果中间值小于当前值，搜索区间缩小到 [c + 1, v]
          u = c + 1;
        } else {
          // 否则，搜索区间缩小到 [u, c]
          v = c;
        }
      }
      // 如果找到的值大于当前值，进行替换
      if (arrI < arr[result[u]]) {
        // 如果 u 不为 0，记录前驱索引
        if (u > 0) {
          p[i] = result[u - 1];
        }
        // 更新 result 中的位置 u 为当前索引 i
        result[u] = i;
      }
    }
  }
  // 重建最长递增子序列
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    // 将索引替换为对应的前驱索引
    result[u] = v;
    v = p[v];
  }
  // 返回最长递增子序列的索引数组
  return result;
}
```

追踪流程：

1. 初始化：
   - `p = [2, 1, 5, 3, 6, 4, 8, 9, 7]` 用于记录每个元素的前驱索引，初始为原数组的副本。
   - `result = [0]` 初始化结果数组，开始时只包含第一个元素的索引 0。

2. 遍历数组：
   - `i = 0, arrI = 2` 第一个元素，索引已在 result 中，继续下一次循环。

   - `i = 1, arrI = 1`
     - `arr[result[result.length - 1]] = arr[0] = 2`
     - `arrI (1) < 2`，需要二分查找替换位置。
     - 二分查找 (u = 0, v = 0)：
       - `c = 0`
       - `arr[result[0]] = 2 > arrI (1)`
       - `v = c = 0`
     - `arrI (1) < arr[result[u]] (2)`，替换 ` result[0] = 1`
     - 更新 `result = [1]`

   - `i = 2, arrI = 5`
     - `arr[result[result.length - 1]] = arr[1] = 1`
     - `arrI (5) > 1`，贪心算法：直接添加到 result
     - `p[2] = 1`
     - `result.push(2)`
     - 更新 `result = [1, 2]`

   - `i = 3, arrI = 3`
     - `arr[result[result.length - 1]] = arr[2] = 5`
     - `arrI (3) < 5`，需要二分查找。
     - 二分查找 (u = 0, v = 1)：
       - `c = 0`
       - `arr[result[0]] = arr[1] = 1 < arrI (3)`
       - `u = c + 1 = 1`
       - `arr[result[1]] = arr[2] = 5 > arrI (3)`
       - `v = c = 1`
     - `arrI (3) < arr[result[u]] (5)`，替换 `result[1] = 3`
     - `p[3] = result[0] = 1`
     - 更新 `result = [1, 3]`

   - `i = 4, arrI = 6`
     - `arr[result[result.length - 1]] = arr[3] = 3`
     - `arrI (6) > 3`，贪心算法：直接添加到 result
     - `p[4] = 3`
     - `result.push(4)`
     - 更新 `result = [1, 3, 4]`

   - `i = 5, arrI = 4`
     - `arr[result[result.length - 1]] = arr[4] = 6`
     - `arrI (4) < 6`，需要二分查找。
     - 二分查找 (u = 0, v = 2) ：
       - `c = 1`
       - `arr[result[1]] = arr[3] = 3 < arrI (4)`
       - `u = c + 1 = 2`
       - `arr[result[2]] = arr[4] = 6 > arrI (4)`
       - `v = c = 2`
     - `arrI (4) < arr[result[u]] (6)`，替换 `result[2] = 5`
     - `p[5] = result[1] = 3`
     - 更新 `result = [1, 3, 5]`

   - `i = 6, arrI = 8`
     - `arr[result[result.length - 1]] = arr[5] = 4`
     - `arrI (8) > 4`，贪心算法：直接添加到 result
     - `p[6] = 5`
     - `result.push(6)`
     - 更新 `result = [1, 3, 5, 6]`

   - `i = 7, arrI = 9`
     - `arr[result[result.length - 1]] = arr[6] = 8`
     - `arrI (9) > 8`，贪心算法：直接添加到 `result`
     - `p[7] = 6`
     - `result.push(7)`
     - 更新 `result = [1, 3, 5, 6, 7]`

   - `i = 8, arrI = 7`
     - `arr[result[result.length - 1]] = arr[7] = 9`
     - `arrI (7) < 9`，需要二分查找。
     - 二分查找 (u = 0, v = 4) ：
       - `c = 2`
       - `arr[result[2]] = arr[5] = 4 < arrI (7)`
       - `u = c + 1 = 3`
       - `c = 3`
       - `arr[result[3]] = arr[6] = 8 > arrI (7)`
       - `v = c = 3`
     - `arrI (7) < arr[result[u]] (8)`，替换 `result[3] = 8`
     - `p[8] = result[2] = 5`
     - 更新 `result = [1, 3, 5, 8, 7]`

3. 重建序列：
   - `u = result.length = 5`
   - `v = result[u - 1] = result[4] = 7`
   - 迭代过程：
     - `result[4] = v = 7`
     - `v = p[7] = 6`
     - `result[3] = v = 6`
     - `v = p[6] = 5`
     - `result[2] = v = 5`
     - `v = p[5] = 3`
     - `result[1] = v = 3`
     - `v = p[3] = 1`
     - `result[0] = v = 1`
     - `v = p[1]`（`p[1]` 初始为 1）
   - 最终 `result = [1, 3, 5, 6, 7]`

4. 映射回原数组的值：
   - `result.map(index => list[index])` 得到 `[1, 3, 4, 8, 9]`
   - 这是输入数组中的一个最长递增子序列

---

-EOF-

# 图解快速diff

>面试题：讲一讲 Vue3 的 diff 算法做了哪些改变？

**双端存在的问题**

在 Vue2 的双端 diff 中，主要的步骤如下：

1. 新头和旧头比较
2. 新尾和旧尾比较
3. 旧头和新尾比较
4. 新头和旧尾比较
5. 暴力对比

这种对比策略其实会存在**额外的移动操作**。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-16-085545.png" alt="image-20240916165545724" style="zoom:50%;" />

- 对于 e 节点匹配不到，新建 e 节点对应的 DOM 节点，放置于旧头对应的 DOM 节点的前面
- 对于 b 节点，通过暴力比对能够找到，将 b 节点移动到旧头对应的 DOM 节点的前面
- 依此类推，c 节点、d 节点所对应的 DOM 节点都会进行移动操作

问题：其实完全不需要移动 bcd 节点，因为在新旧列表里面，这几个节点的顺序是一致的。只需要将 a 节点对应的 DOM 移动到 d 节点后即可。



**Vue3快速diff**

1. 头头比对
2. 尾尾比对
3. 非复杂情况处理
4. 复杂情况处理



**和双端相同步骤**

1. 头头比对
2. 尾尾比对
3. 非复杂情况：指的是经历了头头比对和尾尾比对后，新旧列表有任意一方结束，此时会存在两种情况：
   - 旧节点列表有剩余：对应的旧 DOM 节点全部删除
   - 新节点列表有剩余：创建对应的 DOM 节点，放置于新头节点对应的 DOM 节点之后



**和双端不同的步骤**

经历了头头比对，尾尾比对后，新旧节点列表都有剩余，之后的步骤就和双端 diff 不一样：

1. 初始化keyToNewIndexMap
2. 初始化newIndexToOldIndexMap
3. 更新newIndexToOldIndexMap
4. 计算最长递增子序列
5. 移动和挂载节点



**1. 初始化keyToNewIndexMap**

首先，定义了一个用于保存新节点下标的容器 keyToNewIndexMap，它的形式是 key - index，遍历还未处理的新节点，将它们的key和下标的映射关系存储到 keyToNewIndexMap 中。

```js
const keyToNewIndexMap = new Map();
for (let i = newStartIdx; i <= newEndIdx; i++) {
  const key = newChildren[i].key;
  keyToNewIndexMap.set(key, i);
}
```

示意图：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-17-004920.png" alt="image-20240917084919424" style="zoom:50%;" />

也就是说，该 map 存储了所有未处理的新节点的 key 和 index 的映射关系。



**2. 初始化newIndexToOldIndexMap**

然后，定义了一个和未处理新节点个数同样大小的数组**newIndexToOldIndexMap**，默认每一项均为 0

```js
const toBePatched = newEndIdx - newStartIdx + 1; // 计算没有处理的新节点的个数
const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
```

示意图：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-17-064415.png" alt="image-20240917144414276" style="zoom:50%;" />

之所以一开始初始化为 0 ，其实是为了一开始假设新节点不存在于旧节点列表，之后就会对这个数组进行更新，倘若更新之后当前某个位置还为 0 ，就代表这一位对应的新节点在旧节点列表中不存在。



**3. 更新newIndexToOldIndexMap**

遍历未处理的**旧节点**，查找旧节点在新节点中的位置，决定是更新、删除还是移动。

- 遍历未处理的旧节点（从 oldStartIdx 到 oldEndIdx）

- 对于每个旧节点，执行以下操作：

  - 查找对应的新节点索引 newIndex：

    - 如果旧节点有 key，通过 keyToNewIndexMap 获取 newIndex
    - 如果没有 key，需要遍历新节点列表，找到第一个与旧节点相同的节点

  - 判断节点是否存在与新节点列表：

    - 如果 newIndex 没有找到，说明旧节点已经被删除，需要卸载

    - 如果 newIndex 找到，说明节点需要保留，执行以下操作：

      - 更新节点：调用 patch 函数更新节点内容

      - 记录映射关系：将旧节点的索引 +1 记录到 `newIndexToOldIndexMap[newIndex - newStartIdx]` 中

        >思考🤔：为什么要把旧节点的索引 +1 然后进行存储？
        >
        >答案：因为前面我们在初始化newIndexToOldIndexMap这个数组的时候，所有的值都初始化为了0，代表新节点在旧节点列表中不存在。如果直接存储旧节点的索引，而恰好这个旧节点的索引又为0，那么此时是无法区分究竟是索引值还是不存在。

      - 标记节点是否需要移动：通过比较当前的遍历顺序和 newIndex，初步判断节点是否需要移动。

示意代码：

```js
let moved = false;
let maxNewIndexSoFar = 0;
for (let i = oldStartIdx; i <= oldEndIdx; i++) {
  const oldNode = oldChildren[i];
  let newIndex;
  if (oldNode.key != null) {
    // 旧节点存在 key，根据 key 找到该节点在新节点列表里面的索引值
    newIndex = keyToNewIndexMap.get(oldNode.key);
  } else {
    // 遍历新节点列表匹配
  }
  if (newIndex === undefined) {
    // 旧节点在新节点中不存在，卸载
  } else {
    // 更新节点
    patch(oldNode, newChildren[newIndex], container);
    // 记录映射关系，注意这里在记录的时候，旧节点的索引要加1
    newIndexToOldIndexMap[newIndex - newStartIdx] = i + 1;
    // 判断是否需要移动
    if (newIndex >= maxNewIndexSoFar) {
      maxNewIndexSoFar = newIndex;
    } else {
      moved = true;
    }
  }
}
```

详细步骤：

- i = 0：`[0, 0, 0, 0, 1, 0]`
- i = 1：`[0, 2, 0, 0, 1, 0]`
- i = 2：`[0, 2, 3, 0, 1, 0]`
- i = 3：：`[0, 2, 3, 4, 1, 0]`

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-09-17-065254.png" alt="image-20240917145254007" style="zoom:50%;" />

经过遍历旧节点列表这一操作之后，newIndexToOldIndexMap 就被更新，里面存储了每个新节点在旧节点列表里面的位置，不过要注意，这个索引位置是 +1. 更新后如果某一项仍然是 0，说明这一个节点确实在旧节点列表中不存在

```js
if (newIndex >= maxNewIndexSoFar) {
  maxNewIndexSoFar = newIndex;
} else {
  moved = true;
}
```

maxNewIndexSoFar 用于判断节点的相对顺序是否保持递增，以决定是否需要移动节点。

- 如果当前的新节点索引大于等于 maxNewIndexSoFar，更新 maxNewIndexSoFar，节点相对顺序正确，无需标记移动
- 如果小于，说明节点相对顺序发生变化，标记 moved = true，后续需要根据 LIS 决定是否移动节点。

**4. 计算最长递增子序列**

通过 LIS，确定哪些节点的相对顺序未变，减少需要移动的节点数量。如果在前面的步骤中标记了 moved = true，说明有节点需要移动。使用 newIndexToOldIndexMap 计算最长递增子序列 increasingNewIndexSequence. 

```js
const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
```

上一步我们得到的 newIndexToOldIndex 为  `[0, 2, 3, 4, 1, 0]`，之后得到的最长递增子序列为 `[1, 2, 3]`，注意，Vue3内部在计算最长递增子序列的时候，返回的是元素对应的索引值。

思考🤔：注意这里的最长递增子序列不是记录的具体元素，而是元素对应的下标值。这样有什么好处？

答案：这样刚好抵消了前面+1的操作，重新变回了旧节点的下标。

**5. 移动和挂载节点**

根据计算结果，对需要移动和新建的节点进行处理。**倒序遍历**未处理的新节点。

思考🤔：为什么要倒序遍历？

答案：因为后续的节点位置是确定了的，通过倒序的方式能够避免锚点引用的时候不会出错。

具体步骤：

1. 计算当前新节点在新节点列表中的索引 newIndex = newStartIdx + i

   - newStartIdx 是未处理节点的起始索引
   - i 为倒序遍历时的索引值

2. 获取锚点 DOM，其目的是为了作为节点移动的参照物，当涉及到移动操作时，都移动到锚点 DOM 的前面

   - 计算方法为  `newIndex + 1 < newChildren.length ? newChildren[newIndex + 1].el : null`
   - 如果计算出来为 null，表示没有对应的锚点 DOM ，那么就创建并挂载到最后

3. 判断节点究竟是新挂载还是移动

   - **判断节点是否需要挂载**：如果 `newIndexToOldIndexMap[i] === 0`，说明该节点在旧节点中不存在，需要创建并插入到锚点DOM位置之前。

     ```js
     if (newIndexToOldIndexMap[i] === 0) {
       // 创建新节点并插入到锚点DOM位置之前
       patch(/*参数略 */);
     }
     ```

   - **判断节点是否需要移动**：如果节点在 increasingNewIndexSequence 中，说明位置正确，无需移动。如果不在，则需要移动节点到锚点DOM位置之前。

     ```js
     else if (moved) {
       if (!increasingNewIndexSequence.includes(i)) {
         // 移动节点到锚点DOM之前
         move(/*参数略 */);
       }
     }
     ```

详细步骤：

- i = 5
  - newIndex = 5
  - 锚点DOM：null
  - 创建 m 对应的真实 DOM，挂载到最后
- i = 4
  - newIndex = 4
  - 锚点DOM：m --> 真实DOM
  - `newIndexToOldIndexMap[4]` 是否为 0，不是说明在旧节点列表里面是有的，能够复用
  - 接下来看 i 是否在最长递增子序列里面，发现没有在最长递增子序列里面，那么这里就涉及到移动，移动到锚点DOM的前面，也就是 m 前面
- i = 3
  - newIndex = 3
  - 锚点DOM：a --> 真实DOM
  - `newIndexToOldIndexMap[3]` 不为0，说明旧节点列表里面是有的，能够复用
  - 接下来需要看 i 是否在最长递增子序列里面，发现存在，所以不做任何操作
- i = 2
  - newIndex = 2
  - 锚点DOM：d --> 真实DOM
  - `newIndexToOldIndexMap[2]` 不为0，说明旧节点列表里面是有的，能够复用
  - 接下来需要看 i 是否在最长递增子序列里面，发现存在，所以不做任何操作
- i = 1
  - newIndex = 1
  - 锚点DOM：c --> 真实DOM
  - `newIndexToOldIndexMap[1]` 不为0，说明旧节点列表里面是有的，能够复用
  - 接下来需要看 i 是否在最长递增子序列里面，发现存在，所以不做任何操作
- i = 0
  - newIndex = 0
  - 锚点DOM：b --> 真实DOM
  - `newIndexToOldIndexMap[0]` 为0，说明旧节点列表里面没有
  - 创建新的 DOM 节点，插入到锚点 DOM 节点之前

最终经过上面的操作：

1. e：新建并且插入到 b 之前
2. b： 位置不变，没有做移动操作
3. c：位置不变，没有做移动操作
4. d：位置不变，没有做移动操作
5. a：移动到 m 之前
6. m：新建并且插入到末尾

整个 diff 下来 DOM 操作仅仅有 1 次移动，2 次新建。做到了最最最小化 DOM 操作次数，没有一次 DOM 操作是多余的。

>面试题：讲一讲 Vue3 的 diff 算法做了哪些改变？
>
>参考答案：
>
>Vue2 采用的是双端 diff 算法，而 Vue3 采用的是快速 diff. 这两种 diff 算法前面的步骤都是相同的，先是新旧列表的头节点进行比较，当发现无法复用则进行新旧节点列表的尾节点比较。
>
>一头一尾比较完后，如果旧节点列表有剩余，就将对应的旧 DOM 节点全部删除掉，如果新节点列表有剩余：将新节点列表中剩余的节点创建对应的 DOM，放置于新头节点对应的 DOM 节点后面。
>
>之后两种 diff 算法呈现出不同的操作，双端会进行旧头新尾比较、无法复用则进行旧尾新头比较、再无法复用这是暴力比对，这样的处理会存在多余的移动操作，即便一些新节点的前后顺序和旧节点是一致的，但是还是会产生移动操作。
>
>而 Vue3 快速 diff 则采用了另外一种做法，找到新节点在旧节点中对应的索引列表，然后求出最长递增子序列，凡是位于最长递增子序列里面的索引所对应的元素，是不需要移动位置的，这就做到了只移动需要移动的 DOM 节点，最小化了 DOM 的操作次数，没有任何无意义的移动。可以这么说，Vue3 的 diff 再一次将性能优化到了极致，整套操作下来，没有一次 DOM 操作是多余的，仅仅执行了最必要的 DOM 操作。

---

-EOF-

# 模板编译器

>面试题：说一下 Vue 中 Compiler 的实现原理是什么？

**Vue中的编译器**

Vue 里面的编译器，主要负责将开发者所书写的模板转换为渲染函数。例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

编译后的结果为：

```js
function render(){
  return h('div', [
    h('h1', {id: someId}, 'Hello')
  ])
}
```

这里整个过程并非一触而就的，而是经历一个又一个步骤一点一点转换而来的。

整体来讲，整个编译过程如下图所示：

![image-20231113095532166](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-015532.png)

可以看到，在编译器的内部，实际上又分为了：

- 解析器：负责将模板解析为所对应的 AST
- 转换器：负责将模板 AST 转换为 JavaScript AST
- 生成器：根据 JavaScript 的 AST 生成最终的渲染函数



**解析器**

解析器的核心作用是负责将模板解析为所对应的模板 AST。

首先用户所书写的模板，例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

对于解析器来讲仍然就是一段字符串而已，类似于：

```js
'<template><div><h1 :id="someId">Hello</h1></div></template>'
```

那么解析器是如何进行解析的呢？这里涉及到一个 <u>有限状态机</u> 的概念。

### FSM

FSM，英语全称为 Finite State Machine，翻译成中文就是有限状态机，它首先定义了**一组状态**，然后还定义了状态之间的转移以及触发这些转移的事件。然后就会去解析字符串里面的每一个字符，根据字符做状态的转换。

举一个例子，假设我们要解析的模板内容为：

```js
'<p>Vue</p>'
```

那么整个状态的迁移过程如下：

1. 状态机一开始处于 **初始状态**。
2. 在 **初始状态** 下，读取字符串的第一个字符 < ，然后状态机的状态会更新为 **标签开始状态**。
3. 接下来继续读取下一个字符 p，由于 p 是字母，所以状态机的状态会更新为 **标签名称开始状态**。
4. 接下来读取的下一个字符为 >，状态机的状态会回到 **初始状态**，并且会记录在标签状态下产生的标签名称 p。
5. 读取下一个字符 V，此时状态机会进入到 **文本状态**。
6. 读取下一个字符 u，状态机仍然是 **文本状态**。
7. 读取下一个字符 e，状态机仍然是 **文本状态**。
8. 读取下一个字符 <，此时状态机会进入到 **标签开始状态**。
9. 读取下一个字符 / ，状态机会进入到 **标签结束状态**。
10. 读取下一个字符 p，状态机进入 **标签名称结束状态**。
11. 读取下一个字符 >，状态机进重新回到 **初始状态**。

具体如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-060437.png" alt="image-20231113140436969" style="zoom:60%;" />

```js
let x = 10 + 5;
```

```
token:
let(关键字) x(标识符) =(运算符) 10(数字) +(运算符) 5(数字) ;(分号)
```

对应代码：

```js
const template = '<p>Vue</p>';
// 首先定义一些状态
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称开始状态
  text: 4, // 文本状态
  tagEnd: 5, // 标签结束状态
  tagEndName: 6 // 标签名称结束状态
}

// 判断字符是否为字母
function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

// 将字符串解析为 token
function tokenize(str){
  // 初始化当前状态
  let currentState = State.initial;
  // 用于缓存字符
  const chars = [];
  // 存储解析出来的 token
  const tokens = [];
  
  while(str){
    const char = str[0]; // 获取字符串里面的第一个字符
    
    switch(currentState){
      case State.initial:{
        if(char === '<'){
          currentState = State.tagOpen;
          // 消费一个字符
          str = str.slice(1);
        } else if(isAlpha(char)){
          // 判断是否为字母
          currentState = State.text;
          chars.push(char);
          // 消费一个字符
          str = str.slice(1);
        }
        break;
      }
      case State.tagOpen: {
        // 相应的状态处理
      }
      case State.tagName: {
        // 相应的状态处理
      }
    }
  }
  
  return tokens;
}
tokenize(template);
```

最终解析出来的 token:

```js
[
  {type: 'tag', name: 'p'}, // 开始标签
  {type: 'text', content: 'Vue'}, // 文本节点
  {type: 'tagEnd', name: 'p'}, // 结束标签
]
```



**构造模板AST**

根据 token 列表创建模板 AST 的过程，其实就是对 token 列表进行扫描的过程。从列表的第一个 token 开始，按照顺序进行扫描，直到列表中所有的 token 处理完毕。

在这个过程中，我们需**要维护一个栈**，这个栈将用于维护元素间的父子关系。每遇到一个开始标签节点，就构造一个 Element 类型的 AST 节点，并将其压入栈中。

类似的，每当遇到一个结束标签节点，我们就将当前栈顶的节点弹出。

举个例子，假设我们有如下的模板内容：

```vue
'<div><p>Vue</p><p>React</p></div>'
```

经过上面的 tokenize 后能够得到如下的数组：

```js
[
  {"type": "tag","name": "div"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "Vue"},
  {"type": "tagEnd","name": "p"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "React"},
  {"type": "tagEnd","name": "p"},
  {"type": "tagEnd","name": "div"}
]
```

那么接下来会遍历这个数组（也就是扫描 tokens 列表）

1. 一开始有一个 elementStack 栈，刚开始有一个 Root 节点，[ Root ]

2. 首先是一个 **div tag**，创建一个 Element 类型的 AST 节点，并将其压栈到 elementStack，当前的栈为 `[ Root, div ]`，div 会作为 Root 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070249.png" alt="image-20231113150248725" style="zoom:50%;" />

3. 接下来是 **p tag**，创建一个 Element 类型的 AST 节点，同样会压栈到 elementStack，当前的栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070335.png" alt="image-20231113150335866" style="zoom:50%;" />

4. 接下来是 **Vue text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070356.png" alt="image-20231113150356416" style="zoom:50%;" />

5. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

6. 接下来是 **p tag**，同样创建一个 Element 类型的 AST 节点，压栈后栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070442.png" alt="image-20231113150442450" style="zoom:50%;" />

7. 接下来是 **React text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070537.png" alt="image-20231113150537351" style="zoom:50%;" />

8. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

9. 最后是 **div tagEnd**，发现是一个结束标签，将其弹出，栈区重新为 `[ Root ]`，至此整个 AST 构建完毕

落地到具体的代码，大致就是这样的：

```js
// 解析器
function parse(str){
  const tokens = tokenize(str);
  
  // 创建Root根AST节点
  const root = {
    type: 'Root',
    children: []
  }
  
  // 创建一个栈
  const elementStack = [root]
  
  while(tokens.length){
    // 获取当前栈顶点作为父节点，也就是栈数组最后一项
    const parent = elementStack[elementStack.length - 1];
    // 从 tokens 列表中依次取出第一个 token
    const t = tokens[0];
    
    switch(t.type){
        // 根据不同的type做不同的处理
      case 'tag':{
        // 创建一个Element类型的AST节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: []
        }
        // 将其添加为父节点的子节点
        parent.children.push(elementNode)
        // 将当前节点压入栈里面
        elementStack.push(elementNode)
        break;
      }
      case 'text':
        // 创建文本类型的 AST 节点
        const textNode = {
          type: 'Text',
          content: t.content
        }
        // 将其添加到父级节点的 children 中
        parent.children.push(textNode)
        break
      case 'tagEnd':
        // 遇到结束标签，将当前栈顶的节点弹出
        elementStack.pop()
        break
    }
    // 将处理过的 token 弹出去
    tokens.shift();
  }
}
```

最终，经过上面的处理，就得到了模板的抽象语法树：

```
{
  "type": "Root",
  "children": [
    {
      "type": "Element",
      "tag": "div",
      "children": [
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "Vue"
              }
          ]
        },
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "React"
              }
          ]
        }
      ]
    }
  ]
}
```

# 模板编译器

>面试题：说一下 Vue 中 Compiler 的实现原理是什么？

**Vue中的编译器**

Vue 里面的编译器，主要负责将开发者所书写的模板转换为渲染函数。例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

编译后的结果为：

```js
function render(){
  return h('div', [
    h('h1', {id: someId}, 'Hello')
  ])
}
```

这里整个过程并非一触而就的，而是经历一个又一个步骤一点一点转换而来的。

整体来讲，整个编译过程如下图所示：

![image-20231113095532166](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-015532.png)

可以看到，在编译器的内部，实际上又分为了：

- 解析器：负责将模板解析为所对应的 AST
- 转换器：负责将模板 AST 转换为 JavaScript AST
- 生成器：根据 JavaScript 的 AST 生成最终的渲染函数



**解析器**

解析器的核心作用是负责将模板解析为所对应的模板 AST。

首先用户所书写的模板，例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

对于解析器来讲仍然就是一段字符串而已，类似于：

```js
'<template><div><h1 :id="someId">Hello</h1></div></template>'
```

那么解析器是如何进行解析的呢？这里涉及到一个 <u>有限状态机</u> 的概念。

### FSM

FSM，英语全称为 Finite State Machine，翻译成中文就是有限状态机，它首先定义了**一组状态**，然后还定义了状态之间的转移以及触发这些转移的事件。然后就会去解析字符串里面的每一个字符，根据字符做状态的转换。

举一个例子，假设我们要解析的模板内容为：

```js
'<p>Vue</p>'
```

那么整个状态的迁移过程如下：

1. 状态机一开始处于 **初始状态**。
2. 在 **初始状态** 下，读取字符串的第一个字符 < ，然后状态机的状态会更新为 **标签开始状态**。
3. 接下来继续读取下一个字符 p，由于 p 是字母，所以状态机的状态会更新为 **标签名称开始状态**。
4. 接下来读取的下一个字符为 >，状态机的状态会回到 **初始状态**，并且会记录在标签状态下产生的标签名称 p。
5. 读取下一个字符 V，此时状态机会进入到 **文本状态**。
6. 读取下一个字符 u，状态机仍然是 **文本状态**。
7. 读取下一个字符 e，状态机仍然是 **文本状态**。
8. 读取下一个字符 <，此时状态机会进入到 **标签开始状态**。
9. 读取下一个字符 / ，状态机会进入到 **标签结束状态**。
10. 读取下一个字符 p，状态机进入 **标签名称结束状态**。
11. 读取下一个字符 >，状态机进重新回到 **初始状态**。

具体如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-060437.png" alt="image-20231113140436969" style="zoom:60%;" />

```js
let x = 10 + 5;
```

```
token:
let(关键字) x(标识符) =(运算符) 10(数字) +(运算符) 5(数字) ;(分号)
```

对应代码：

```js
const template = '<p>Vue</p>';
// 首先定义一些状态
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称开始状态
  text: 4, // 文本状态
  tagEnd: 5, // 标签结束状态
  tagEndName: 6 // 标签名称结束状态
}

// 判断字符是否为字母
function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

// 将字符串解析为 token
function tokenize(str){
  // 初始化当前状态
  let currentState = State.initial;
  // 用于缓存字符
  const chars = [];
  // 存储解析出来的 token
  const tokens = [];
  
  while(str){
    const char = str[0]; // 获取字符串里面的第一个字符
    
    switch(currentState){
      case State.initial:{
        if(char === '<'){
          currentState = State.tagOpen;
          // 消费一个字符
          str = str.slice(1);
        } else if(isAlpha(char)){
          // 判断是否为字母
          currentState = State.text;
          chars.push(char);
          // 消费一个字符
          str = str.slice(1);
        }
        break;
      }
      case State.tagOpen: {
        // 相应的状态处理
      }
      case State.tagName: {
        // 相应的状态处理
      }
    }
  }
  
  return tokens;
}
tokenize(template);
```

最终解析出来的 token:

```js
[
  {type: 'tag', name: 'p'}, // 开始标签
  {type: 'text', content: 'Vue'}, // 文本节点
  {type: 'tagEnd', name: 'p'}, // 结束标签
]
```



**构造模板AST**

根据 token 列表创建模板 AST 的过程，其实就是对 token 列表进行扫描的过程。从列表的第一个 token 开始，按照顺序进行扫描，直到列表中所有的 token 处理完毕。

在这个过程中，我们需**要维护一个栈**，这个栈将用于维护元素间的父子关系。每遇到一个开始标签节点，就构造一个 Element 类型的 AST 节点，并将其压入栈中。

类似的，每当遇到一个结束标签节点，我们就将当前栈顶的节点弹出。

举个例子，假设我们有如下的模板内容：

```vue
'<div><p>Vue</p><p>React</p></div>'
```

经过上面的 tokenize 后能够得到如下的数组：

```js
[
  {"type": "tag","name": "div"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "Vue"},
  {"type": "tagEnd","name": "p"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "React"},
  {"type": "tagEnd","name": "p"},
  {"type": "tagEnd","name": "div"}
]
```

那么接下来会遍历这个数组（也就是扫描 tokens 列表）

1. 一开始有一个 elementStack 栈，刚开始有一个 Root 节点，[ Root ]

2. 首先是一个 **div tag**，创建一个 Element 类型的 AST 节点，并将其压栈到 elementStack，当前的栈为 `[ Root, div ]`，div 会作为 Root 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070249.png" alt="image-20231113150248725" style="zoom:50%;" />

3. 接下来是 **p tag**，创建一个 Element 类型的 AST 节点，同样会压栈到 elementStack，当前的栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070335.png" alt="image-20231113150335866" style="zoom:50%;" />

4. 接下来是 **Vue text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070356.png" alt="image-20231113150356416" style="zoom:50%;" />

5. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

6. 接下来是 **p tag**，同样创建一个 Element 类型的 AST 节点，压栈后栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070442.png" alt="image-20231113150442450" style="zoom:50%;" />

7. 接下来是 **React text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070537.png" alt="image-20231113150537351" style="zoom:50%;" />

8. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

9. 最后是 **div tagEnd**，发现是一个结束标签，将其弹出，栈区重新为 `[ Root ]`，至此整个 AST 构建完毕

落地到具体的代码，大致就是这样的：

```js
// 解析器
function parse(str){
  const tokens = tokenize(str);
  
  // 创建Root根AST节点
  const root = {
    type: 'Root',
    children: []
  }
  
  // 创建一个栈
  const elementStack = [root]
  
  while(tokens.length){
    // 获取当前栈顶点作为父节点，也就是栈数组最后一项
    const parent = elementStack[elementStack.length - 1];
    // 从 tokens 列表中依次取出第一个 token
    const t = tokens[0];
    
    switch(t.type){
        // 根据不同的type做不同的处理
      case 'tag':{
        // 创建一个Element类型的AST节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: []
        }
        // 将其添加为父节点的子节点
        parent.children.push(elementNode)
        // 将当前节点压入栈里面
        elementStack.push(elementNode)
        break;
      }
      case 'text':
        // 创建文本类型的 AST 节点
        const textNode = {
          type: 'Text',
          content: t.content
        }
        // 将其添加到父级节点的 children 中
        parent.children.push(textNode)
        break
      case 'tagEnd':
        // 遇到结束标签，将当前栈顶的节点弹出
        elementStack.pop()
        break
    }
    // 将处理过的 token 弹出去
    tokens.shift();
  }
}
```

最终，经过上面的处理，就得到了模板的抽象语法树：

```
{
  "type": "Root",
  "children": [
    {
      "type": "Element",
      "tag": "div",
      "children": [
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "Vue"
              }
          ]
        },
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "React"
              }
          ]
        }
      ]
    }
  ]
}
```



**转换器**

目前为止，我们已经得到了模板的 AST，回顾一下 Vue 中整个模板的编译过程，大致如下：

```js
// 编译器
function compile(template){
  // 1. 解析器对模板进行解析，得到模板的AST
  const ast = parse(template)
  // 2. 转换器：将模板AST转换为JS AST
  transform(ast)
  // 3. 生成器：在 JS AST 的基础上生成 JS 代码
  const code = genrate(ast)
  
  return code;
}
```

转换器的核心作用就是负责将模板 AST 转换为 JavaScript AST。

整体来讲，转换器的编写分为两大部分：

- 模板 AST 的遍历与转换
- 生成 JavaScript AST



**模板AST的遍历与转换**

步骤一：先书写一个简单的工具方法，方便查看一个模板 AST 中的节点信息。

```js
function dump(node, indent = 0) {
    // 获取当前节点的类型
    const type = node.type;
    // 根据节点类型构建描述信息
    // 对于根节点，描述为空；对于元素节点，使用标签名；对于文本节点，使用内容
    const desc =
      node.type === "Root"
        ? ""
        : node.type === "Element"
        ? node.tag
        : node.content;

    // 打印当前节点信息，包括类型和描述
    // 使用重复的"-"字符来表示缩进（层级）
    console.log(`${"-".repeat(indent)}${type}: ${desc}`);

    // 如果当前节点有子节点，递归调用dump函数打印每个子节点
    if (node.children) {
      node.children.forEach((n) => dump(n, indent + 2));
    }
}
```

步骤二：接下来下一步就是遍历整棵模板 AST 树，并且能够做一些改动

```js
function tranverseNode(ast){
  // 获取到当前的节点
  const currentNode = ast;
  
  // 将p修改为h1
  if(currentNode.type === 'Element' && currentNode.tag === 'p'){
    currentNode.tag = 'h1';
  }
  
  // 新增需求：将文本节点全部改为大写
  if(currentNode.type === 'Text'){
    currentNode.content = currentNode.content.toUpperCase();
  }
  
  // 获取当前节点的子节点
  const children = currentNode.children;
  if(children){
    for(let i = 0;i< children.length; i++){
      tranverseNode(children[i])
    }
  }
}

function transform(ast){
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast);
  
  console.log(dump(ast));
}
```

目前tranverseNode虽然能够正常工作，但是内部有两个职责：遍历、转换，接下来需要将这两个职责进行解耦。

步骤三：在 transform 里面维护一个上下文对象（环境：包含执行代码时用到的一些信息）

```js
// 需要将之前的转换方法全部提出来，每一种转换提取成一个单独的方法
function transformElement(node){
  if(node.type === 'Element' && node.tag === 'p'){
    node.tag = 'h1';
  }
}

function transformText(node){
  if(node.type === 'Text'){
    node.content = node.content.toUpperCase();
  }
}

// 该方法只负责遍历，转换的工作交给转换函数
// 转换函数是存放于上下文对象里面的
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode);
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}


function transform(ast){
  // 上下文对象：包含一些重要信息
  const context = {
    currentNode: null, // 存储当前正在转换的节点
    childIndex: 0, // 子节点在父节点的 children 数组中的索引
    parent: null, // 存储父节点
    nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
  }
  
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast, context);
  
  
}
```

步骤四：完善 context 上下文对象，这里主要是添加2个方法

1. 替换节点方法
2. 删除节点方法

```js
const context = {
  currentNode: null, // 存储当前正在转换的节点
  childIndex: 0, // 子节点在父节点的 children 数组中的索引
  parent: null, // 存储父节点
  // 替换节点
  replaceNode(node){
    context.parent.children[context.childIndex] = node;
    context.currentNode = node;
  },
  // 删除节点
  removeNode(){
    if(context.parent){
      context.parent.children.splice(context.childIndex, 1);
      context.currentNode = null;
    }
  },
  nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
}
```

注意因为存在删除节点的操作，所以在tranverseNode方法里面执行转换函数之后，需要进行非空的判断：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode, context);
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}
```

步骤五：解决节点处理的次数问题

目前来讲，遍历的顺序是深度遍历，从父节点到子节点。但是我们的需求是：子节点处理完之后，重新回到父节点，对父节点进行处理。

首先需要对转换函数进行改造：返回一个函数

```js
function transformText(node, context) {
  // 省略第一次处理....
  
  return ()=>{
    // 对节点再次进行处理
  }
}
```

tranverseNode需要拿一个数组存储转换函数返回的函数：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;
  
  // 1. 增加一个数组，用于存储转换函数返回的函数
  const exitFns = []

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    // 执行转换函数的时候，接收其返回值
    const onExit = transforms[i](context.currentNode, context);
    if(onExit){
      exitFns.push(onExit)
    }
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
  
  // 在节点处理完成之后，执行exitFns里面所有的函数
  // 执行的顺序是从后往前依次执行
  let i = exitFns.length;
  while(i--){
    exitFns[i]()
  }
}
```

# 模板编译器

>面试题：说一下 Vue 中 Compiler 的实现原理是什么？

**Vue中的编译器**

Vue 里面的编译器，主要负责将开发者所书写的模板转换为渲染函数。例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

编译后的结果为：

```js
function render(){
  return h('div', [
    h('h1', {id: someId}, 'Hello')
  ])
}
```

这里整个过程并非一触而就的，而是经历一个又一个步骤一点一点转换而来的。

整体来讲，整个编译过程如下图所示：

![image-20231113095532166](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-015532.png)

可以看到，在编译器的内部，实际上又分为了：

- 解析器：负责将模板解析为所对应的 AST
- 转换器：负责将模板 AST 转换为 JavaScript AST
- 生成器：根据 JavaScript 的 AST 生成最终的渲染函数



**解析器**

解析器的核心作用是负责将模板解析为所对应的模板 AST。

首先用户所书写的模板，例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

对于解析器来讲仍然就是一段字符串而已，类似于：

```js
'<template><div><h1 :id="someId">Hello</h1></div></template>'
```

那么解析器是如何进行解析的呢？这里涉及到一个 <u>有限状态机</u> 的概念。

### FSM

FSM，英语全称为 Finite State Machine，翻译成中文就是有限状态机，它首先定义了**一组状态**，然后还定义了状态之间的转移以及触发这些转移的事件。然后就会去解析字符串里面的每一个字符，根据字符做状态的转换。

举一个例子，假设我们要解析的模板内容为：

```js
'<p>Vue</p>'
```

那么整个状态的迁移过程如下：

1. 状态机一开始处于 **初始状态**。
2. 在 **初始状态** 下，读取字符串的第一个字符 < ，然后状态机的状态会更新为 **标签开始状态**。
3. 接下来继续读取下一个字符 p，由于 p 是字母，所以状态机的状态会更新为 **标签名称开始状态**。
4. 接下来读取的下一个字符为 >，状态机的状态会回到 **初始状态**，并且会记录在标签状态下产生的标签名称 p。
5. 读取下一个字符 V，此时状态机会进入到 **文本状态**。
6. 读取下一个字符 u，状态机仍然是 **文本状态**。
7. 读取下一个字符 e，状态机仍然是 **文本状态**。
8. 读取下一个字符 <，此时状态机会进入到 **标签开始状态**。
9. 读取下一个字符 / ，状态机会进入到 **标签结束状态**。
10. 读取下一个字符 p，状态机进入 **标签名称结束状态**。
11. 读取下一个字符 >，状态机进重新回到 **初始状态**。

具体如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-060437.png" alt="image-20231113140436969" style="zoom:60%;" />

```js
let x = 10 + 5;
```

```
token:
let(关键字) x(标识符) =(运算符) 10(数字) +(运算符) 5(数字) ;(分号)
```

对应代码：

```js
const template = '<p>Vue</p>';
// 首先定义一些状态
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称开始状态
  text: 4, // 文本状态
  tagEnd: 5, // 标签结束状态
  tagEndName: 6 // 标签名称结束状态
}

// 判断字符是否为字母
function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

// 将字符串解析为 token
function tokenize(str){
  // 初始化当前状态
  let currentState = State.initial;
  // 用于缓存字符
  const chars = [];
  // 存储解析出来的 token
  const tokens = [];
  
  while(str){
    const char = str[0]; // 获取字符串里面的第一个字符
    
    switch(currentState){
      case State.initial:{
        if(char === '<'){
          currentState = State.tagOpen;
          // 消费一个字符
          str = str.slice(1);
        } else if(isAlpha(char)){
          // 判断是否为字母
          currentState = State.text;
          chars.push(char);
          // 消费一个字符
          str = str.slice(1);
        }
        break;
      }
      case State.tagOpen: {
        // 相应的状态处理
      }
      case State.tagName: {
        // 相应的状态处理
      }
    }
  }
  
  return tokens;
}
tokenize(template);
```

最终解析出来的 token:

```js
[
  {type: 'tag', name: 'p'}, // 开始标签
  {type: 'text', content: 'Vue'}, // 文本节点
  {type: 'tagEnd', name: 'p'}, // 结束标签
]
```



**构造模板AST**

根据 token 列表创建模板 AST 的过程，其实就是对 token 列表进行扫描的过程。从列表的第一个 token 开始，按照顺序进行扫描，直到列表中所有的 token 处理完毕。

在这个过程中，我们需**要维护一个栈**，这个栈将用于维护元素间的父子关系。每遇到一个开始标签节点，就构造一个 Element 类型的 AST 节点，并将其压入栈中。

类似的，每当遇到一个结束标签节点，我们就将当前栈顶的节点弹出。

举个例子，假设我们有如下的模板内容：

```vue
'<div><p>Vue</p><p>React</p></div>'
```

经过上面的 tokenize 后能够得到如下的数组：

```js
[
  {"type": "tag","name": "div"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "Vue"},
  {"type": "tagEnd","name": "p"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "React"},
  {"type": "tagEnd","name": "p"},
  {"type": "tagEnd","name": "div"}
]
```

那么接下来会遍历这个数组（也就是扫描 tokens 列表）

1. 一开始有一个 elementStack 栈，刚开始有一个 Root 节点，[ Root ]

2. 首先是一个 **div tag**，创建一个 Element 类型的 AST 节点，并将其压栈到 elementStack，当前的栈为 `[ Root, div ]`，div 会作为 Root 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070249.png" alt="image-20231113150248725" style="zoom:50%;" />

3. 接下来是 **p tag**，创建一个 Element 类型的 AST 节点，同样会压栈到 elementStack，当前的栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070335.png" alt="image-20231113150335866" style="zoom:50%;" />

4. 接下来是 **Vue text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070356.png" alt="image-20231113150356416" style="zoom:50%;" />

5. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

6. 接下来是 **p tag**，同样创建一个 Element 类型的 AST 节点，压栈后栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070442.png" alt="image-20231113150442450" style="zoom:50%;" />

7. 接下来是 **React text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070537.png" alt="image-20231113150537351" style="zoom:50%;" />

8. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

9. 最后是 **div tagEnd**，发现是一个结束标签，将其弹出，栈区重新为 `[ Root ]`，至此整个 AST 构建完毕

落地到具体的代码，大致就是这样的：

```js
// 解析器
function parse(str){
  const tokens = tokenize(str);
  
  // 创建Root根AST节点
  const root = {
    type: 'Root',
    children: []
  }
  
  // 创建一个栈
  const elementStack = [root]
  
  while(tokens.length){
    // 获取当前栈顶点作为父节点，也就是栈数组最后一项
    const parent = elementStack[elementStack.length - 1];
    // 从 tokens 列表中依次取出第一个 token
    const t = tokens[0];
    
    switch(t.type){
        // 根据不同的type做不同的处理
      case 'tag':{
        // 创建一个Element类型的AST节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: []
        }
        // 将其添加为父节点的子节点
        parent.children.push(elementNode)
        // 将当前节点压入栈里面
        elementStack.push(elementNode)
        break;
      }
      case 'text':
        // 创建文本类型的 AST 节点
        const textNode = {
          type: 'Text',
          content: t.content
        }
        // 将其添加到父级节点的 children 中
        parent.children.push(textNode)
        break
      case 'tagEnd':
        // 遇到结束标签，将当前栈顶的节点弹出
        elementStack.pop()
        break
    }
    // 将处理过的 token 弹出去
    tokens.shift();
  }
}
```

最终，经过上面的处理，就得到了模板的抽象语法树：

```
{
  "type": "Root",
  "children": [
    {
      "type": "Element",
      "tag": "div",
      "children": [
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "Vue"
              }
          ]
        },
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "React"
              }
          ]
        }
      ]
    }
  ]
}
```



**转换器**

目前为止，我们已经得到了模板的 AST，回顾一下 Vue 中整个模板的编译过程，大致如下：

```js
// 编译器
function compile(template){
  // 1. 解析器对模板进行解析，得到模板的AST
  const ast = parse(template)
  // 2. 转换器：将模板AST转换为JS AST
  transform(ast)
  // 3. 生成器：在 JS AST 的基础上生成 JS 代码
  const code = genrate(ast)
  
  return code;
}
```

转换器的核心作用就是负责将模板 AST 转换为 JavaScript AST。

整体来讲，转换器的编写分为两大部分：

- 模板 AST 的遍历与转换
- 生成 JavaScript AST



**模板AST的遍历与转换**

步骤一：先书写一个简单的工具方法，方便查看一个模板 AST 中的节点信息。

```js
function dump(node, indent = 0) {
    // 获取当前节点的类型
    const type = node.type;
    // 根据节点类型构建描述信息
    // 对于根节点，描述为空；对于元素节点，使用标签名；对于文本节点，使用内容
    const desc =
      node.type === "Root"
        ? ""
        : node.type === "Element"
        ? node.tag
        : node.content;

    // 打印当前节点信息，包括类型和描述
    // 使用重复的"-"字符来表示缩进（层级）
    console.log(`${"-".repeat(indent)}${type}: ${desc}`);

    // 如果当前节点有子节点，递归调用dump函数打印每个子节点
    if (node.children) {
      node.children.forEach((n) => dump(n, indent + 2));
    }
}
```

步骤二：接下来下一步就是遍历整棵模板 AST 树，并且能够做一些改动

```js
function tranverseNode(ast){
  // 获取到当前的节点
  const currentNode = ast;
  
  // 将p修改为h1
  if(currentNode.type === 'Element' && currentNode.tag === 'p'){
    currentNode.tag = 'h1';
  }
  
  // 新增需求：将文本节点全部改为大写
  if(currentNode.type === 'Text'){
    currentNode.content = currentNode.content.toUpperCase();
  }
  
  // 获取当前节点的子节点
  const children = currentNode.children;
  if(children){
    for(let i = 0;i< children.length; i++){
      tranverseNode(children[i])
    }
  }
}

function transform(ast){
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast);
  
  console.log(dump(ast));
}
```

目前tranverseNode虽然能够正常工作，但是内部有两个职责：遍历、转换，接下来需要将这两个职责进行解耦。

步骤三：在 transform 里面维护一个上下文对象（环境：包含执行代码时用到的一些信息）

```js
// 需要将之前的转换方法全部提出来，每一种转换提取成一个单独的方法
function transformElement(node){
  if(node.type === 'Element' && node.tag === 'p'){
    node.tag = 'h1';
  }
}

function transformText(node){
  if(node.type === 'Text'){
    node.content = node.content.toUpperCase();
  }
}

// 该方法只负责遍历，转换的工作交给转换函数
// 转换函数是存放于上下文对象里面的
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode);
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}


function transform(ast){
  // 上下文对象：包含一些重要信息
  const context = {
    currentNode: null, // 存储当前正在转换的节点
    childIndex: 0, // 子节点在父节点的 children 数组中的索引
    parent: null, // 存储父节点
    nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
  }
  
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast, context);
  
  
}
```

步骤四：完善 context 上下文对象，这里主要是添加2个方法

1. 替换节点方法
2. 删除节点方法

```js
const context = {
  currentNode: null, // 存储当前正在转换的节点
  childIndex: 0, // 子节点在父节点的 children 数组中的索引
  parent: null, // 存储父节点
  // 替换节点
  replaceNode(node){
    context.parent.children[context.childIndex] = node;
    context.currentNode = node;
  },
  // 删除节点
  removeNode(){
    if(context.parent){
      context.parent.children.splice(context.childIndex, 1);
      context.currentNode = null;
    }
  },
  nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
}
```

注意因为存在删除节点的操作，所以在tranverseNode方法里面执行转换函数之后，需要进行非空的判断：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode, context);
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}
```

步骤五：解决节点处理的次数问题

目前来讲，遍历的顺序是深度遍历，从父节点到子节点。但是我们的需求是：子节点处理完之后，重新回到父节点，对父节点进行处理。

首先需要对转换函数进行改造：返回一个函数

```js
function transformText(node, context) {
  // 省略第一次处理....
  
  return ()=>{
    // 对节点再次进行处理
  }
}
```

tranverseNode需要拿一个数组存储转换函数返回的函数：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;
  
  // 1. 增加一个数组，用于存储转换函数返回的函数
  const exitFns = []

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    // 执行转换函数的时候，接收其返回值
    const onExit = transforms[i](context.currentNode, context);
    if(onExit){
      exitFns.push(onExit)
    }
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
  
  // 在节点处理完成之后，执行exitFns里面所有的函数
  // 执行的顺序是从后往前依次执行
  let i = exitFns.length;
  while(i--){
    exitFns[i]()
  }
}
```



**生成JS AST**

要生成 JavaScript 的 AST，我们首先需要知道 JavaScript 的 AST 是如何描述代码的。

假设有这么一段代码：

```js
function render(){
  return null
}
```

那么所对应的 JS AST 为：

![image-20231120143716229](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-20-063716.png)

这里有几个比较关键的部分：

- id：对应函数的名称，类型为 Identifier
- params：对应的是函数的参数，是一个数组
- body：对应的是函数体，由于函数体可以有多条语句，因此是一个数组

要查看一段 JS 代码所对应的 AST 结构，可以在 [这里](https://astexplorer.net/) 进行查看。

于是，我们可以仿造上面的样子，**自己设计一个基本的数据结构**来描述函数声明语句，例如：

```js
const FunctionDeclNode = {
  type: 'FunctionDecl', // 代表该节点是一个函数声明
  id: {
    type: 'Identifier'
    name: 'render' // name 用来存储函数名称
  },
  params: [], // 函数参数
  body: [
    {
      type: 'ReturnStatement',
      return: null
    }
  ]
}
```

> 对比真实的 AST，这里去除了箭头函数、生成器函数、async 函数等情况。

接下来回到我们上面的模板，假设模板内容仍然为：

```html
<div><p>Vue</p><p>React</p></div>
```

那么转换出来的渲染函数应该是：

```js
function render(){
  return h('div', [
    h('p', 'Vue'),
    h('p', 'React'),
  ])
}
```

这里出现了 h 函数的调用以及数组表达式还有字符串表达式，仍然可以去参阅这段代码真实的 AST。

这里 h 函数对应的应该是：

```js
// 我们自己设计一个节点表示 h 函数的调用
const callExp = {
  type: 'CallExpression',
  callee: {
    type: 'Identifier',
    name: 'h'
  }
}
```

字符串对应的是：

```js
// 我们自己设计字符串对应的节点
const Str = {
  type: 'StringLiteral',
  value: 'div'
}
```

> 这里以最外层的 div 字符串为例

数组对应的是：

```js
const Arr = {
  type: 'ArrayExpression',
  // 数组中的元素
  elements: []
}
```

因此按照我们所设计的 AST 数据结构，上面的模板最终转换出来的 JavaScript AST 应该是这样的：

```js
{
  "type": "FunctionDecl",
  "id": {
      "type": "Identifier",
      "name": "render"
  },
  "params": [],
  "body": [
      {
          "type": "ReturnStatement",
          "return": {
              "type": "CallExpression",
              "callee": {"type": "Identifier", "name": "h"},
              "arguments": [
                  {"type": "StringLiteral", "value": "div"},
                  {"type": "ArrayExpression","elements": [
                        {
                            "type": "CallExpression",
                            "callee": {"type": "Identifier", "name": "h"},
                            "arguments": [
                                {"type": "StringLiteral", "value": "p"},
                                {"type": "StringLiteral", "value": "Vue"}
                            ]
                        },
                        {
                            "type": "CallExpression",
                            "callee": {"type": "Identifier", "name": "h"},
                            "arguments": [
                                {"type": "StringLiteral", "value": "p"},
                                {"type": "StringLiteral", "value": "React"}
                            ]
                        }
                    ]
                  }
              ]
          }
      }
  ]
}
```

我们需要一些辅助函数，这些辅助函数都很简单，一并给出如下：

```js
function createStringLiteral(value) {
  return {
    type: 'StringLiteral',
    value
  }
}

function createIdentifier(name) {
  return {
    type: 'Identifier',
    name
  }
}

function createArrayExpression(elements) {
  return {
    type: 'ArrayExpression',
    elements
  }
}

function createCallExpression(callee, arguments) {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments
  }
}
```

有了这些辅助函数后，接下来我们来修改转换函数。

首先是文本转换

```js
function transformText(node, context){
  if(node.type !== 'Text'){
    return
  }
  // 创建文本所对应的 JS AST 节点
  // 将创建好的 AST 节点挂到节点的 jsNode 属性上面
  node.jsNode = createStringLiteral(node.content);
}
```

Element元素转换

```js
function transformElement(node, context){
  // 这里应该是所有的子节点处理完毕后，再进行处理
  return ()=>{
    if(node.type !== 'Element'){
      return;
    }
    
    // 创建函数调用的AST节点
    const callExp = createCallExpression('h', [
      createStringLiteral(node.tag),
    ])
    
    // 处理函数调用的参数
    node.children.length === 1
    ? // 如果长度为1说明只有一个子节点，直接将子节点的 jsNode 作为参数
      callExp.arguments.push(node.children[0].jsNode)
    : // 说明有多个子节点
    callExp.arguments.push(
    	createArrayExpression(node.children.map(c=>c.jsNode))
    )
    
    node.jsNode = callExp
  }
}
```

transformRoot转换：

```js
function transformRoot(node, context){
  // 在退出的回调函数中书写处理逻辑
  // 因为要保证所有的子节点已经处理完毕
  return ()=>{
    if(node.type !== 'Root'){
      return;
    }
    
    const vnodeJSAST = node.children[0].jsNode;
    
    node.jsNode = {
      type: 'FunctionDecl',
      id: {type: 'Identifier', name: 'render'},
      params: [],
      body: [{
        type: 'ReturnStatement',
        return: vnodeJSAST
      }]
    }
  }
}
```

最后修改 nodeTransforms，将这几个转换函数放进去：

```js
nodeTransforms: [
  transformRoot,
  transformElement,
  transformText
]
```

至此，我们就完成模板 AST 转换为 JS AST 的工作。

通过 ast.jsNode 能够拿到转换出来的结果。

# 模板编译器

>面试题：说一下 Vue 中 Compiler 的实现原理是什么？

**Vue中的编译器**

Vue 里面的编译器，主要负责将开发者所书写的模板转换为渲染函数。例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

编译后的结果为：

```js
function render(){
  return h('div', [
    h('h1', {id: someId}, 'Hello')
  ])
}
```

这里整个过程并非一触而就的，而是经历一个又一个步骤一点一点转换而来的。

整体来讲，整个编译过程如下图所示：

![image-20231113095532166](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-015532.png)

可以看到，在编译器的内部，实际上又分为了：

- 解析器：负责将模板解析为所对应的 AST
- 转换器：负责将模板 AST 转换为 JavaScript AST
- 生成器：根据 JavaScript 的 AST 生成最终的渲染函数



**解析器**

解析器的核心作用是负责将模板解析为所对应的模板 AST。

首先用户所书写的模板，例如：

```vue
<template>
	<div>
  	<h1 :id="someId">Hello</h1>
  </div>
</template>
```

对于解析器来讲仍然就是一段字符串而已，类似于：

```js
'<template><div><h1 :id="someId">Hello</h1></div></template>'
```

那么解析器是如何进行解析的呢？这里涉及到一个 <u>有限状态机</u> 的概念。

### FSM

FSM，英语全称为 Finite State Machine，翻译成中文就是有限状态机，它首先定义了**一组状态**，然后还定义了状态之间的转移以及触发这些转移的事件。然后就会去解析字符串里面的每一个字符，根据字符做状态的转换。

举一个例子，假设我们要解析的模板内容为：

```js
'<p>Vue</p>'
```

那么整个状态的迁移过程如下：

1. 状态机一开始处于 **初始状态**。
2. 在 **初始状态** 下，读取字符串的第一个字符 < ，然后状态机的状态会更新为 **标签开始状态**。
3. 接下来继续读取下一个字符 p，由于 p 是字母，所以状态机的状态会更新为 **标签名称开始状态**。
4. 接下来读取的下一个字符为 >，状态机的状态会回到 **初始状态**，并且会记录在标签状态下产生的标签名称 p。
5. 读取下一个字符 V，此时状态机会进入到 **文本状态**。
6. 读取下一个字符 u，状态机仍然是 **文本状态**。
7. 读取下一个字符 e，状态机仍然是 **文本状态**。
8. 读取下一个字符 <，此时状态机会进入到 **标签开始状态**。
9. 读取下一个字符 / ，状态机会进入到 **标签结束状态**。
10. 读取下一个字符 p，状态机进入 **标签名称结束状态**。
11. 读取下一个字符 >，状态机进重新回到 **初始状态**。

具体如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-060437.png" alt="image-20231113140436969" style="zoom:60%;" />

```js
let x = 10 + 5;
```

```
token:
let(关键字) x(标识符) =(运算符) 10(数字) +(运算符) 5(数字) ;(分号)
```

对应代码：

```js
const template = '<p>Vue</p>';
// 首先定义一些状态
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称开始状态
  text: 4, // 文本状态
  tagEnd: 5, // 标签结束状态
  tagEndName: 6 // 标签名称结束状态
}

// 判断字符是否为字母
function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

// 将字符串解析为 token
function tokenize(str){
  // 初始化当前状态
  let currentState = State.initial;
  // 用于缓存字符
  const chars = [];
  // 存储解析出来的 token
  const tokens = [];
  
  while(str){
    const char = str[0]; // 获取字符串里面的第一个字符
    
    switch(currentState){
      case State.initial:{
        if(char === '<'){
          currentState = State.tagOpen;
          // 消费一个字符
          str = str.slice(1);
        } else if(isAlpha(char)){
          // 判断是否为字母
          currentState = State.text;
          chars.push(char);
          // 消费一个字符
          str = str.slice(1);
        }
        break;
      }
      case State.tagOpen: {
        // 相应的状态处理
      }
      case State.tagName: {
        // 相应的状态处理
      }
    }
  }
  
  return tokens;
}
tokenize(template);
```

最终解析出来的 token:

```js
[
  {type: 'tag', name: 'p'}, // 开始标签
  {type: 'text', content: 'Vue'}, // 文本节点
  {type: 'tagEnd', name: 'p'}, // 结束标签
]
```



**构造模板AST**

根据 token 列表创建模板 AST 的过程，其实就是对 token 列表进行扫描的过程。从列表的第一个 token 开始，按照顺序进行扫描，直到列表中所有的 token 处理完毕。

在这个过程中，我们需**要维护一个栈**，这个栈将用于维护元素间的父子关系。每遇到一个开始标签节点，就构造一个 Element 类型的 AST 节点，并将其压入栈中。

类似的，每当遇到一个结束标签节点，我们就将当前栈顶的节点弹出。

举个例子，假设我们有如下的模板内容：

```vue
'<div><p>Vue</p><p>React</p></div>'
```

经过上面的 tokenize 后能够得到如下的数组：

```js
[
  {"type": "tag","name": "div"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "Vue"},
  {"type": "tagEnd","name": "p"},
  {"type": "tag","name": "p"},
  {"type": "text","content": "React"},
  {"type": "tagEnd","name": "p"},
  {"type": "tagEnd","name": "div"}
]
```

那么接下来会遍历这个数组（也就是扫描 tokens 列表）

1. 一开始有一个 elementStack 栈，刚开始有一个 Root 节点，[ Root ]

2. 首先是一个 **div tag**，创建一个 Element 类型的 AST 节点，并将其压栈到 elementStack，当前的栈为 `[ Root, div ]`，div 会作为 Root 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070249.png" alt="image-20231113150248725" style="zoom:50%;" />

3. 接下来是 **p tag**，创建一个 Element 类型的 AST 节点，同样会压栈到 elementStack，当前的栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070335.png" alt="image-20231113150335866" style="zoom:50%;" />

4. 接下来是 **Vue text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070356.png" alt="image-20231113150356416" style="zoom:50%;" />

5. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

6. 接下来是 **p tag**，同样创建一个 Element 类型的 AST 节点，压栈后栈为 `[ Root, div, p ]`，p 会作为 div 的子节点

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070442.png" alt="image-20231113150442450" style="zoom:50%;" />

7. 接下来是 **React text**，此时会创建一个 Text 类型的 AST 节点，作为 p 的子节点。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-13-070537.png" alt="image-20231113150537351" style="zoom:50%;" />

8. 接下来是 **p tagEnd**，发现是一个结束标签，所以会将 p 这个 AST 节点弹出栈，当前的栈为 `[ Root, div ]`

9. 最后是 **div tagEnd**，发现是一个结束标签，将其弹出，栈区重新为 `[ Root ]`，至此整个 AST 构建完毕

落地到具体的代码，大致就是这样的：

```js
// 解析器
function parse(str){
  const tokens = tokenize(str);
  
  // 创建Root根AST节点
  const root = {
    type: 'Root',
    children: []
  }
  
  // 创建一个栈
  const elementStack = [root]
  
  while(tokens.length){
    // 获取当前栈顶点作为父节点，也就是栈数组最后一项
    const parent = elementStack[elementStack.length - 1];
    // 从 tokens 列表中依次取出第一个 token
    const t = tokens[0];
    
    switch(t.type){
        // 根据不同的type做不同的处理
      case 'tag':{
        // 创建一个Element类型的AST节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: []
        }
        // 将其添加为父节点的子节点
        parent.children.push(elementNode)
        // 将当前节点压入栈里面
        elementStack.push(elementNode)
        break;
      }
      case 'text':
        // 创建文本类型的 AST 节点
        const textNode = {
          type: 'Text',
          content: t.content
        }
        // 将其添加到父级节点的 children 中
        parent.children.push(textNode)
        break
      case 'tagEnd':
        // 遇到结束标签，将当前栈顶的节点弹出
        elementStack.pop()
        break
    }
    // 将处理过的 token 弹出去
    tokens.shift();
  }
}
```

最终，经过上面的处理，就得到了模板的抽象语法树：

```
{
  "type": "Root",
  "children": [
    {
      "type": "Element",
      "tag": "div",
      "children": [
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "Vue"
              }
          ]
        },
        {
          "type": "Element",
          "tag": "p",
          "children": [
              {
                "type": "Text",
                "content": "React"
              }
          ]
        }
      ]
    }
  ]
}
```



**转换器**

目前为止，我们已经得到了模板的 AST，回顾一下 Vue 中整个模板的编译过程，大致如下：

```js
// 编译器
function compile(template){
  // 1. 解析器对模板进行解析，得到模板的AST
  const ast = parse(template)
  // 2. 转换器：将模板AST转换为JS AST
  transform(ast)
  // 3. 生成器：在 JS AST 的基础上生成 JS 代码
  const code = genrate(ast)
  
  return code;
}
```

转换器的核心作用就是负责将模板 AST 转换为 JavaScript AST。

整体来讲，转换器的编写分为两大部分：

- 模板 AST 的遍历与转换
- 生成 JavaScript AST



**模板AST的遍历与转换**

步骤一：先书写一个简单的工具方法，方便查看一个模板 AST 中的节点信息。

```js
function dump(node, indent = 0) {
    // 获取当前节点的类型
    const type = node.type;
    // 根据节点类型构建描述信息
    // 对于根节点，描述为空；对于元素节点，使用标签名；对于文本节点，使用内容
    const desc =
      node.type === "Root"
        ? ""
        : node.type === "Element"
        ? node.tag
        : node.content;

    // 打印当前节点信息，包括类型和描述
    // 使用重复的"-"字符来表示缩进（层级）
    console.log(`${"-".repeat(indent)}${type}: ${desc}`);

    // 如果当前节点有子节点，递归调用dump函数打印每个子节点
    if (node.children) {
      node.children.forEach((n) => dump(n, indent + 2));
    }
}
```

步骤二：接下来下一步就是遍历整棵模板 AST 树，并且能够做一些改动

```js
function tranverseNode(ast){
  // 获取到当前的节点
  const currentNode = ast;
  
  // 将p修改为h1
  if(currentNode.type === 'Element' && currentNode.tag === 'p'){
    currentNode.tag = 'h1';
  }
  
  // 新增需求：将文本节点全部改为大写
  if(currentNode.type === 'Text'){
    currentNode.content = currentNode.content.toUpperCase();
  }
  
  // 获取当前节点的子节点
  const children = currentNode.children;
  if(children){
    for(let i = 0;i< children.length; i++){
      tranverseNode(children[i])
    }
  }
}

function transform(ast){
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast);
  
  console.log(dump(ast));
}
```

目前tranverseNode虽然能够正常工作，但是内部有两个职责：遍历、转换，接下来需要将这两个职责进行解耦。

步骤三：在 transform 里面维护一个上下文对象（环境：包含执行代码时用到的一些信息）

```js
// 需要将之前的转换方法全部提出来，每一种转换提取成一个单独的方法
function transformElement(node){
  if(node.type === 'Element' && node.tag === 'p'){
    node.tag = 'h1';
  }
}

function transformText(node){
  if(node.type === 'Text'){
    node.content = node.content.toUpperCase();
  }
}

// 该方法只负责遍历，转换的工作交给转换函数
// 转换函数是存放于上下文对象里面的
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode);
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}


function transform(ast){
  // 上下文对象：包含一些重要信息
  const context = {
    currentNode: null, // 存储当前正在转换的节点
    childIndex: 0, // 子节点在父节点的 children 数组中的索引
    parent: null, // 存储父节点
    nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
  }
  
  // 在遍历模板AST树的时候，可以针对部分节点作出一些修改
  tranverseNode(ast, context);
  
  
}
```

步骤四：完善 context 上下文对象，这里主要是添加2个方法

1. 替换节点方法
2. 删除节点方法

```js
const context = {
  currentNode: null, // 存储当前正在转换的节点
  childIndex: 0, // 子节点在父节点的 children 数组中的索引
  parent: null, // 存储父节点
  // 替换节点
  replaceNode(node){
    context.parent.children[context.childIndex] = node;
    context.currentNode = node;
  },
  // 删除节点
  removeNode(){
    if(context.parent){
      context.parent.children.splice(context.childIndex, 1);
      context.currentNode = null;
    }
  },
  nodeTransforms: [transformElement, transformText], // 存储具体的转换方法
}
```

注意因为存在删除节点的操作，所以在tranverseNode方法里面执行转换函数之后，需要进行非空的判断：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode, context);
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
}
```

步骤五：解决节点处理的次数问题

目前来讲，遍历的顺序是深度遍历，从父节点到子节点。但是我们的需求是：子节点处理完之后，重新回到父节点，对父节点进行处理。

首先需要对转换函数进行改造：返回一个函数

```js
function transformText(node, context) {
  // 省略第一次处理....
  
  return ()=>{
    // 对节点再次进行处理
  }
}
```

tranverseNode需要拿一个数组存储转换函数返回的函数：

```js
function tranverseNode(ast, context) {
  // 获取到当前的节点
  context.currentNode = ast;
  
  // 1. 增加一个数组，用于存储转换函数返回的函数
  const exitFns = []

  // 从上下文对象里面拿到所有的转换方法
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    // 执行转换函数的时候，接收其返回值
    const onExit = transforms[i](context.currentNode, context);
    if(onExit){
      exitFns.push(onExit)
    }
    // 由于删除节点的时候，当前节点会被置为null，所以需要判断
    // 如果当前节点为null，直接返回
    if(!context.currentNode) return;
  }

  // 获取当前节点的子节点
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      // 更新上下文里面的信息
      context.parent = context.currentNode;
      context.childIndex = i;
      tranverseNode(children[i], context);
    }
  }
  
  // 在节点处理完成之后，执行exitFns里面所有的函数
  // 执行的顺序是从后往前依次执行
  let i = exitFns.length;
  while(i--){
    exitFns[i]()
  }
}
```



**生成JS AST**

要生成 JavaScript 的 AST，我们首先需要知道 JavaScript 的 AST 是如何描述代码的。

假设有这么一段代码：

```js
function render(){
  return null
}
```

那么所对应的 JS AST 为：

![image-20231120143716229](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2023-11-20-063716.png)

这里有几个比较关键的部分：

- id：对应函数的名称，类型为 Identifier
- params：对应的是函数的参数，是一个数组
- body：对应的是函数体，由于函数体可以有多条语句，因此是一个数组

要查看一段 JS 代码所对应的 AST 结构，可以在 [这里](https://astexplorer.net/) 进行查看。

于是，我们可以仿造上面的样子，**自己设计一个基本的数据结构**来描述函数声明语句，例如：

```js
const FunctionDeclNode = {
  type: 'FunctionDecl', // 代表该节点是一个函数声明
  id: {
    type: 'Identifier'
    name: 'render' // name 用来存储函数名称
  },
  params: [], // 函数参数
  body: [
    {
      type: 'ReturnStatement',
      return: null
    }
  ]
}
```

> 对比真实的 AST，这里去除了箭头函数、生成器函数、async 函数等情况。

接下来回到我们上面的模板，假设模板内容仍然为：

```html
<div><p>Vue</p><p>React</p></div>
```

那么转换出来的渲染函数应该是：

```js
function render(){
  return h('div', [
    h('p', 'Vue'),
    h('p', 'React'),
  ])
}
```

这里出现了 h 函数的调用以及数组表达式还有字符串表达式，仍然可以去参阅这段代码真实的 AST。

这里 h 函数对应的应该是：

```js
// 我们自己设计一个节点表示 h 函数的调用
const callExp = {
  type: 'CallExpression',
  callee: {
    type: 'Identifier',
    name: 'h'
  }
}
```

字符串对应的是：

```js
// 我们自己设计字符串对应的节点
const Str = {
  type: 'StringLiteral',
  value: 'div'
}
```

> 这里以最外层的 div 字符串为例

数组对应的是：

```js
const Arr = {
  type: 'ArrayExpression',
  // 数组中的元素
  elements: []
}
```

因此按照我们所设计的 AST 数据结构，上面的模板最终转换出来的 JavaScript AST 应该是这样的：

```js
{
  "type": "FunctionDecl",
  "id": {
      "type": "Identifier",
      "name": "render"
  },
  "params": [],
  "body": [
      {
          "type": "ReturnStatement",
          "return": {
              "type": "CallExpression",
              "callee": {"type": "Identifier", "name": "h"},
              "arguments": [
                  {"type": "StringLiteral", "value": "div"},
                  {"type": "ArrayExpression","elements": [
                        {
                            "type": "CallExpression",
                            "callee": {"type": "Identifier", "name": "h"},
                            "arguments": [
                                {"type": "StringLiteral", "value": "p"},
                                {"type": "StringLiteral", "value": "Vue"}
                            ]
                        },
                        {
                            "type": "CallExpression",
                            "callee": {"type": "Identifier", "name": "h"},
                            "arguments": [
                                {"type": "StringLiteral", "value": "p"},
                                {"type": "StringLiteral", "value": "React"}
                            ]
                        }
                    ]
                  }
              ]
          }
      }
  ]
}
```

我们需要一些辅助函数，这些辅助函数都很简单，一并给出如下：

```js
function createStringLiteral(value) {
  return {
    type: 'StringLiteral',
    value
  }
}

function createIdentifier(name) {
  return {
    type: 'Identifier',
    name
  }
}

function createArrayExpression(elements) {
  return {
    type: 'ArrayExpression',
    elements
  }
}

function createCallExpression(callee, arguments) {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments
  }
}
```

有了这些辅助函数后，接下来我们来修改转换函数。

首先是文本转换

```js
function transformText(node, context){
  if(node.type !== 'Text'){
    return
  }
  // 创建文本所对应的 JS AST 节点
  // 将创建好的 AST 节点挂到节点的 jsNode 属性上面
  node.jsNode = createStringLiteral(node.content);
}
```

Element元素转换

```js
function transformElement(node, context){
  // 这里应该是所有的子节点处理完毕后，再进行处理
  return ()=>{
    if(node.type !== 'Element'){
      return;
    }
    
    // 创建函数调用的AST节点
    const callExp = createCallExpression('h', [
      createStringLiteral(node.tag),
    ])
    
    // 处理函数调用的参数
    node.children.length === 1
    ? // 如果长度为1说明只有一个子节点，直接将子节点的 jsNode 作为参数
      callExp.arguments.push(node.children[0].jsNode)
    : // 说明有多个子节点
    callExp.arguments.push(
    	createArrayExpression(node.children.map(c=>c.jsNode))
    )
    
    node.jsNode = callExp
  }
}
```

transformRoot转换：

```js
function transformRoot(node, context){
  // 在退出的回调函数中书写处理逻辑
  // 因为要保证所有的子节点已经处理完毕
  return ()=>{
    if(node.type !== 'Root'){
      return;
    }
    
    const vnodeJSAST = node.children[0].jsNode;
    
    node.jsNode = {
      type: 'FunctionDecl',
      id: {type: 'Identifier', name: 'render'},
      params: [],
      body: [{
        type: 'ReturnStatement',
        return: vnodeJSAST
      }]
    }
  }
}
```

最后修改 nodeTransforms，将这几个转换函数放进去：

```js
nodeTransforms: [
  transformRoot,
  transformElement,
  transformText
]
```

至此，我们就完成模板 AST 转换为 JS AST 的工作。

通过 ast.jsNode 能够拿到转换出来的结果。



**生成器**

目前编译器的整体流程：

```js
// 编译器
function compile(template){
  // 1. 解析器对模板进行解析，得到模板的AST
  const ast = parse(template)
  // 2. 转换器：将模板AST转换为JS AST
  transform(ast)
  // 3. 生成器：在 JS AST 的基础上生成 JS 代码
  const code = genrate(ast)
  
  return code;
}
```

在生成器里面需要维护一个上下文对象，用于存储一些重要的状态信息。

```js
function generate(ast){
  const context = {
    code: "", // 存储最终生成的代码
    // 生成代码本质上就是字符串的拼接
    push(code){
      context.code += code;
    },
    // 当前缩进的级别，初始值为0，没有缩进
    currentIndent: 0,
    // 用于换行的，并且会根据缩进的级别添加对应的缩进
    newLine(){
      context.code += "\n" + `  `.repeat(context.currentIndent);
    },
    // 增加缩进级别
    indent(){
      context.currentIndent++;
      context.newLine();
    },
    // 降低缩进级别
    deIndent(){
      context.currentIndent--;
      context.newLine();
    }
  }
  
  genNode(ast, context);
  
  return context.code;
}
```

genNode 方法：根据不同的节点类型，调用不同的方法：

```js
function genNode(node, context){
  switch(node.type){
    case 'FunctionDecl':
      genFunctionDecl(node, context)
      break
    case 'ReturnStatement':
      genReturnStatement(node, context)
      break
   	case 'CallExpression':
      genCallExpression(node, context)
      break
    case 'StringLiteral':
      genStringLiteral(node, context)
      break
    case 'ArrayExpression':
      genArrayExpression(node, context)
      break
  }
}
```

最后就是各种生成方法：本质上就是根据不同的节点类型，做不同的字符串拼接

```js
// 生成字符串字面量
function genStringLiteral(node, context){
  const { push } = context;
  push(`'${node.value}'`)
}
// 生成返回语句
function genReturnStatement(node, context){
  const { push } = context;
  push(`return `)
  genNode(node.return, context);
}
// 生成函数声明
function genFunctionDecl(node, context) {
  // 从上下文中获取一些实用函数
  const { push, indent, deIndent } = context;
  // 向输出中添加 "function 函数名"
  push(`function ${node.id.name} `);
  // 添加左括号开始参数列表
  push(`(`);
  // 生成参数列表
  genNodeList(node.params, context);
  // 添加右括号结束参数列表
  push(`) `);
  // 添加左花括号开始函数体
  push(`{`);
  // 缩进，为函数体的代码生成做准备
  indent();
  // 遍历函数体中的每个节点，生成相应的代码
  node.body.forEach((n) => genNode(n, context));
  // 减少缩进
  deIndent();
  // 添加右花括号结束函数体
  push(`}`);
}

// 生成节点列表
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // 生成当前节点的代码
    genNode(node, context);

    // 如果当前节点不是最后一个节点，添加逗号分隔
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}

// 生成函数调用表达式
function genCallExpression(node, context) {
  const { push } = context;
  const { callee, arguments: args } = node;

  // 添加 "函数名("
  push(`${callee.name}(`);
  // 生成参数列表
  genNodeList(args, context);
  // 添加 ")"
  push(`)`);
}

// 生成数组表达式
function genArrayExpression(node, context) {
  const { push } = context;
  // 添加 "["
  push("[");
  // 生成数组元素
  genNodeList(node.elements, context);
  // 添加 "]"
  push("]");
}
```



> 面试题：说一下 Vue 中 Compiler 的实现原理是什么？
>
> 参考答案：
>
> 在 Vue 中，Compiler 主要用于将开发者的模板编译为渲染函数，内部可以分为 3 个大的组件：
>
> 1. 解析器：负责将模板解析为对应的模板 AST
>
>    - 内部用到了有限状态机来进行解析，这是解析标记语言的常用方式，浏览器内部解析 HTML 也是通过有限状态机的方式进行解析的。
>
>    - 解析的结果能够获取到一个 token 的数组
>
>    - 紧接着扫描 token 列表，通过栈的方式将 token 压入和弹出栈，发现是起始标记时就入栈，发现是结束标记时就出栈，最终能够得到模板 AST 树结构
>
> 2. 转换器：负责将模板 AST 转换为 JS AST
>
>    - 内部会维护一个上下文对象，用于存储一些关键的信息
>
>      - 当前正在转换的节点
>      - 当前正在转换的子节点在父节点的 children 数组中的索引
>      - 当前正在转换的父节点
>      - 具体的转换函数
>
>        - 对节点的处理分为进入阶段处理一次和退出阶段处理一次
>          - 这种思想在各个地方都非常常见，例如：
>
>            - React 中的 beginWork、completeWork
>            - Koa 中间件所采用的洋葱模型
>
>    - 生成 JS AST
>      - 不同的节点对应不同的节点对象，对象里面会包含节点的 type、name、value 一类的信息
>        - 主要就是遍历模板的 AST，根据不同的节点，返回对应的对象
>
> 3. 生成器：根据 JS AST 生成最终的渲染函数
>    - 主要就是遍历 JS AST，根据不同的节点对象，拼接不同的字符
>
>
> 当然，整个 Compiler 内部还会做很多的优化，从而带来性能上的提升。不知道这一块儿需不需要我展开讲一下？

---

-EOF-

# 模板编译提升

>面试题：说一下 Vue3 在进行模板编译时做了哪些优化？

1. 静态提升
2. 预字符串化
3. 缓存事件处理函数
4. Block Tree
5. PatchFlag

## 静态提升

静态提升 Static Hoisting，在模板编译阶段识别并提升不变的静态节点到渲染函数外部，从而减少每次渲染时的计算量。被提升的节点无需重复创建。

**哪些节点会被提升**

1. 元素节点
2. 没有绑定动态内容的节点

**一个提升的示例**

```vue
<template>
  <div>
    <p>这是一个静态的段落。</p>
    <p>{{ dynamicMessage }}</p>
  </div>
</template>
```

在 Vue2 时期不管是静态节点还是动态节点，都会编译为 **创建虚拟节点函数** 的调用。

```js
with(this) {
  return createElement('div', [
    createElement('p', [createTextVNode("这是一个静态的段落。")]),
    createElement('p', [createTextVNode(toString(dynamicMessage))])
  ])
}
```

Vue3 中，编译器会对**静态内容的编译结果进行提升**：

```js
const _hoisted_1 = /*#__PURE__*/createStaticVNode("<p>这是一个静态的段落。</p>", 1);

export function render(_ctx, _cache) {
  return (openBlock(), createElementBlock("div", null, [
    _hoisted_1,
    createElementVNode("p", null, toDisplayString(_ctx.dynamicMessage), 1 /* TEXT */)
  ]))
}
```



除了静态节点，静态属性也是能够提升的，例如：

```vue
<template>
  <button class="btn btn-primary">{{ buttonText }}</button>
</template>
```

在这个模板中，虽然 button 是一个动态节点，但是属性是固定的，因此这里也有优化的空间：

```js
// 静态属性提升
const _hoisted_1 = { class: "btn btn-primary" };

export function render(_ctx, _cache) {
  return (openBlock(), createElementBlock("button", _hoisted_1, toDisplayString(_ctx.buttonText), 1 /* TEXT */))
}
```



## 预字符串化

当编译器遇到**大量连续的静态内容**时，会直接将其**编译为一个普通的字符串节点**。例如：

```vue
<template>
  <div class="menu-bar-container">
    <div class="logo">
      <h1>logo</h1>
    </div>
    <ul class="nav">
      <li><a href="">menu</a></li>
      <li><a href="">menu</a></li>
      <li><a href="">menu</a></li>
      <li><a href="">menu</a></li>
      <li><a href="">menu</a></li>
    </ul>
    <div class="user">
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const user = ref({
  name: "zhangsan",
});
</script>
```

编译结果中和静态提升相关的部分：

```js
const _hoisted_1 = { class: "menu-bar-container" }
const _hoisted_2 = /*#__PURE__*/_createStaticVNode("<div class=\"logo\"><h1>logo</h1></div><ul class=\"nav\"><li><a href=\"\">menu</a></li><li><a href=\"\">menu</a></li><li><a href=\"\">menu</a></li><li><a href=\"\">menu</a></li><li><a href=\"\">menu</a></li></ul>", 2)
const _hoisted_4 = { class: "user" }
```

其中的 _hoisted_2 就是将连续的静态节点编译为了字符串。

思考🤔：这样有什么好处呢？

答案：当大量的连续的静态节点被编译为字符串节点后，整体的虚拟 DOM 节点数量就少了，自然而然 diff 的速度就更快了。

Vue2:

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-27-034042.png" alt="vue2" style="zoom:50%;" />

Vue3:

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-27-034043.png" alt="vue3" style="zoom:50%;" />

第二个好处就是在 SSR 的时候，无需重复计算和转换，减少了服务器端的计算量和处理时间。

思考🤔：大量连续的静态内容时，会启用预字符串化处理，大量连续的边界在哪里？

答案：在 Vue3 编译器内部有一个阀值，目前是 10 个节点左右会启动预字符串化。

```vue
<template>
  <div class="menu-bar-container">
    <div class="logo">
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
      <h1>logo</h1>
    </div>
    <div class="user">
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const user = ref({
  name: "zhangsan",
});
</script>
```

## 缓存内联事件处理函数

模板在进行编译的时候，会针对**内联的事件处理函数**做缓存。例如：

```vue
<button @click="count++">plus</button>
```

在 Vue2 中，每次渲染都会为这个内联事件创建一个新的函数，这会产生不必要的内存开销和性能损耗。

```js
render(ctx){
  return createVNode("button", {
    // 每次渲染的时候，都会创建一个新的函数
    onClick: function($event){
      ctx.count++;
    }
  })
}
```

在 Vue3 中，为了优化这种情况，编译器会自动为内联事件处理函数生成缓存代码。

```js
render(ctx, _cache){
  return createVNode("button", {
    // 如果缓存里面有，直接从缓存里面取
    // 如果缓存里面没有，创建一个新的事件处理函数，然后将其放入到缓存里面
    onClick: cache[0] || (cache[0] = ($event) => (ctx.count++))
  })
}
```

思考🤔：为什么仅针对内联事件处理函数进行缓存？

答案：非内联事件处理函数不需要缓存，因为非内联事件处理函数在组件实例化的时候就存在了，不会在每次渲染时重新创建。缓存机制主要是为了解决内联事件处理函数在每次渲染的时候重复创建的问题。

## block tree

Vue2 在对比新旧树的时候，并不知道哪些节点是静态的，哪些是动态的，因此只能一层一层比较，这就浪费了大部分时间在比对静态节点上，例如下面的代码：

```vue
<form>
  <div>
    <label>账号：</label>
    <input v-model="user.loginId" />
  </div>
  <div>
    <label>密码：</label>
    <input v-model="user.loginPwd" />
  </div>
</form>
```

![20200929172002](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-27-041058.png)

每次状态更新时，Vue2 需要遍历整个虚拟 DOM 树来寻找差异。这种方法虽然通用，但在大型组件或复杂页面中，性能损耗会比较明显，因为它浪费了大量时间在静态节点的比较上。

思考🤔：前面不是说静态节点会提升么？

答案：静态提升解决的是不再重复生成静态节点所对应的虚拟DOM节点。现在要解决的问题是虚拟DOM树中静态节点比较能否跳过的问题。



**什么是Block**

一个 Block 本质上也是一个虚拟 DOM 节点，不过该**虚拟 DOM 节点上面会多出来一个 dynamicChildren 属性**，该属性对应的值为数组，**数组里面存储的是动态子节点**。以上面的代码为例，form 对应的虚拟 DOM 节点就会存在 dynamicChildren 属性：

![20200929172555](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-27-041226.png)

有了 block 之后，就不需要再像 Vue2 那样一层一层，每个节点进行对比了，对比的粒度变成了直接找 dynamicChildren 数组，然后对比该数组里面的动态节点，这样就很好的实现了跳过静态节点比较。



**哪些节点会成为 block 节点？**

1. 模板中的根节点都会是一个 block 节点。

   ```vue
   <template>
   	<!-- 这是一个block节点 -->
   	<div>
       <p>{{ bar }}</p>
     </div>
   	<!-- 这是一个block节点 -->
   	<h1>
       <span :id="test"></span>
     </h1>
   </template>
   ```

2. 任何带有 v-if、v-else-if、v-else、v-for 指令的节点，也需要作为 block 节点。

   答案：因为这些指令会让虚拟DOM树的结构不稳定。

   ```vue
   <div>
     <section v-if="foo">
     	<p>{{ a }}</p>
     </section>
     <div v-else>
       <p>{{ a }}</p>
     </div>
   </div>
   ```

   按照之前的设计，div是一个 block 节点，收集到的动态节点只有 p. 这意味着无论 foo 是 true 还是 false，最终更新只会去看 p 是否发生变化，从而产生 bug.

   解决方案也很简单，让带有这些指令的节点成为一个 block 节点即可

   ```
   block(div)
   	- block(section)
   	- block(div)
   ```

   此时这种设计，父级block除了收集动态子节点以外，还会收集子block节点。

   多个 block 节点自然就形成了树的结构，这就是 block tree.

## 补丁标记

补丁标记 PatchFlags，这是 Vue 在做节点对比时的近一步优化。

即便是动态的节点，一般也不会是节点所有信息（类型、属性、文本内容）都发生了更改，而仅仅只是一部分信息发生更改。

之前在 Vue2 时期对比每一个节点时，并不知道这个节点哪些相关信息会发生变化，因此只能将所有信息依次比对，例如：

```vue
<div :class="user" data-id="1" title="user name">
  {{user.name}}
</div>
```

在 Vue2 中：

- 全面对比：会逐个去检查节点的每个属性（class、data-id、title）以及子节点的内容
- 性能瓶颈：这种方式自然就存在一定的性能优化空间

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-08-27-062917.png" alt="20200929172805" style="zoom:60%;" />

在 Vue3 中，PatchFlag 通过为每个节点生成标记，显著优化了对比过程。编译器在编译模板时，能够识别哪些属性或内容是动态的，并为这些动态部分生成特定的标记。

Vue3 的 PatchFlag 包括多种类型，每种类型标记不同的更新需求：

- TEXT：表示节点的文本内容可能会发生变化。
- CLASS：表示节点的 class 属性是动态的，可能会发生变化。
- STYLE：表示节点的 style 属性是动态的，可能会发生变化。
- PROPS：表示节点的一个或多个属性是动态的，可能会发生变化。
- FULL_PROPS：表示节点有多个动态属性，且这些属性不是简单的静态值。
- HYDRATE_EVENTS：表示节点的事件监听器是动态的，需要在客户端进行水合处理。
- STABLE_FRAGMENT：表示节点的子节点顺序稳定，允许按顺序进行更新。
- KEYED_FRAGMENT：表示节点的子节点带有 key，可以通过 key 进行高效的更新。
- UNKEYED_FRAGMENT：表示节点的子节点无 key，但可以通过简单的比较进行更新。

例如上面的代码，编译出来的函数：

```js
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", {
    class: _normalizeClass($setup.user),
    "data-id": "1",
    title: "user name"
  }, _toDisplayString($setup.user.name), 3 /* TEXT, CLASS */))
}
```

通过这些标记，Vue3 在更新时不再需要对每个属性都进行全面的对比，而是只检查和更新那些被标记为动态的部分，从而显著减少了不必要的计算开销。



>面试题：说一下 Vue3 在进行模板编译时做了哪些优化？
>
>参考答案：
>
>Vue3 的编译器在进行模板编译的时候，主要做了这么一些优化：
>
>1. 静态提升：解决的是静态内容不要重复生成新的虚拟 DOM 节点的问题
>2. 预字符串化：解决的是大量的静态内容，干脆虚拟 DOM 节点都不要了，直接生成字符串，虚拟 DOM 节点少了，diff 的时间花费也就更少。
>3. 缓存内联事件处理函数：每次运行渲染函数时，内联的事件处理函数没有必要重新生成，这样会产生不必要的内存开销和性能损耗。所以可以将内联事件处理函数缓存起来，在下一次执行渲染函数的时候，直接从缓存中获取。
>4. Block Tree：解决的是跳过静态节点比较的问题。
>5. 补丁标记：能够做到即便动态节点进行比较，也只比较有变化的部分的效果。

---

-EOF-

# 组件name作用

>面试题：组件 name 有什么用？可不可以不写 name？

**如何定义组件name**

- Vue2 OptionsAPI：添加 name 配置项即可

  ```js
  export default {
    name: 'xxxx', // 组件的name
  }
  ```

- Vue3 CompositionAPI

  - 多书写一个script标签，仍然导出对象，在对象中配置name

    ```vue
    <script setup>
    // ...
    </script>
    <script>
    export default {
      name: 'xxx'
    }
    </script>
    ```

  - 通过一个 defineOptions 的宏来配置name

    ```vue
    <script setup>
    defineOptions({
      name: 'xxx'
    })
    </script>
    ```


**组件name的作用**

1. 通过名字找到对应的组件
   - 递归组件
   - 跨级组件通信
2. 通过 name 属性指定要缓存的组件
3. 使用 vue-devtools 进行调试时，组件名称也是由 name 决定的

>面试题：组件 name 有什么用？可不可以不写 name？
>
>参考答案：
>
>在 Vue 中，组件的 name 选项有多个作用，虽然它不是必须的，但在某些场景下它非常有用。
>
>1. 通过名字找到对应的组件
>
>   - 递归组件
>   - 跨级组件通信
>2. 通过 name 属性指定要缓存的组件
>3. 使用 vue-devtools 进行调试时，组件名称也是由 name 决定的
>
>即使在没有上述特殊需求的情况下，添加 name 也有助于提高代码的可读性，尤其是在调试和分析性能时。为组件命名可以使开发者更清楚地了解每个组件的用途和角色。

---

-EOF-

# Vue项目性能优化

>面试题1：你平时开发 Vue 项目时，做了哪些性能上的优化？

1. 代码层面优化
2. 场景优化
3. 静态资源优化
4. 打包优化
5. 用户体验优化

**代码层面优化**

1. 组件拆分
2. 减少不必要的响应式数据
3. 正确使用 v-if 和 v-show
4. 根据场景可以选择使用 v-once
5. 使用 key 优化列表渲染
6. 事件防抖和节流
7. 使用 KeepAlive 缓存组件
8. 合理使用生命周期钩子方法
9. 使用异步组件
10. 路由懒加载

**场景优化**

1. 懒加载
2. 虚拟滚动
3. .....

**静态资源优化**

1. 图片优化
   - 压缩图片
   - 使用现代图片格式：WebP、AVIF
2. 使用SVG图标
   1. 精灵图
   2. 字体图标
   3. SVG图标
3. 压缩 CSS 和 JS 文件
   - Terser、UglifyJS、cssnano
4. 合并文件
5. 使用CDN加速

**打包优化**

1. tree sharking
2. 多线程打包
   - webpack 插件：thread-loader
3. 代码分块：主要是为了实现按需加载
4. 生成sourcemap文件
5. 优化第三方库的打包：按需打包
6. 使用现代构建工具

**用户体验优化**

记住，一切的优化，最终目的是为了给用户提供更好的使用体验。

1. 加载动画
2. 骨架屏
3. 过渡动画
4. 服务端渲染



>面试题1：你平时开发 Vue 项目时，做了哪些性能上的优化？
>
>参考答案：
>
>这取决于我当前处于哪一个阶段，不同阶段所做的事情不太一样。假设当前处于编码阶段，那么有这么一些优化的地方：
>
>- 组件拆分
>- v-if 和 v-show 的正确使用
>- 使用 v-once 指令
>- 使用 key 优化列表渲染
>- 缓存组件
>- 使用异步组件
>- 路由懒加载
>- ....
>
>另外看我具体开发的项目是什么，如果遇到有长列表的场景，那么可以使用虚拟列表来提升长列表性能。静态资源往往占据了较大的带宽和加载时间。因此，对静态资源进行优化是提高页面性能的一个重要方面，例如可以做：
>
>- 图片的压缩
>- 图标采用 SVG 图标
>- 一些比较大的第三方库选择不打包到最后的项目里面，而是采用 CDN 的方式加载
>
>刚才说到项目打包，打包时也有具体的优化措施，例如：
>
>- Tree Sharking
>- 多线程打包
>- 代码分块
>- ....
>
>最后我想说一下，其实所做的一切的一切性能优化，最终目的其实只有一个，就是给用户更好的用户体验。所以在用户体验上面我也会额外的用心，采取一些优化措施提升用户的使用观感，例如：
>
>- 骨架屏
>- 过渡动画
>- ....





> 面试题2：在优化前端性能方面，你通常会采取哪些措施？

1. 发现问题：需要具体的数据来做支撑，确定问题确实存在。
2. 确定问题：确定是哪一个方面的问题？前端？网路？服务端问题？数据库？
3. 解决问题：确定了是前端的问题之后，再根据具体的问题给出具体的解决方案

>面试题2：在优化前端性能方面，你通常会采取哪些措施？
>
>参考答案：
>
>首先我不会着急就去做相关的性能优化，第一步我会做的是确认问题是否存在，因为每个人的感官是不一样的，一个人拿着 3G 网络的手机使用我的应用，回头给我反馈应用打开速度慢，那这绝对不是我们这边的问题。因此第一步就是用一些有效的工具和数据来确认是否真的存在性能问题。
>
>- 性能监控工具：使用 Lighthouse、Chrome DevTools、WebPageTest 等工具来评估页面性能，获取页面的加载时间、资源请求时间、渲染速度等具体数据。
>- 用户数据埋点：通过埋点监控用户的实际使用情况，如页面加载时间、交互响应时间、长任务（Long Tasks）等。分析这些数据，确定用户体验的瓶颈。
>
>那确定确实存在性能问题的时候，接下来下一步是确定问题来源，因为一个 Web 应用是由多个部分组成的，自然性能问题也可能来自于多个方面：
>
>- 前端问题：可能是由于大文件加载、DOM 操作频繁、动画性能差等造成的。
>- 网络问题：可能是由于服务器响应慢、带宽不足、DNS 查询耗时、网络延迟高等。
>- 服务器端问题：服务器性能瓶颈、数据库查询缓慢、缓存失效等问题。
>- 数据库问题：数据库索引不当、查询性能差、数据传输量大等。
>
>前端这一块儿的话，可以使用浏览器的 Performance 面板、网络请求分析工具，以及服务器端的日志和监控工具，找出性能瓶颈的具体位置。之后确定了是前端存在的性能问题后，再进行针对性的优化。这一步应该根据具体的瓶颈采取不同的优化策略：
>
>- 网络请求过多：减少 HTTP 请求，合并 CSS 和 JS 文件，使用 CSS 精灵图或 SVG 图标，或者使用 HTTP/2 多路复用技术。
>- 静态资源太大：做资源压缩和优化，压缩 JS、CSS、图片等资源，使用 WebP 等高效图片格式。
>- 初始加载资源过多：按需加载 JS 和 CSS，使用动态 import 分割代码，使用异步组件以及路由懒加载
>- 渲染性能瓶颈：减少重排重绘次数。
>- ....
>
>这就是我平时在解决性能问题时的一个思考路径。

---

-EOF-

# 路由传参方式

>面试题：Vue 项目中前端路由传参方式有哪些？

1. 路径参数
2. 查询参数
3. 路由状态参数
4. 路由props参数



**1. 路径参数**

通过 params 获取路径参数

```js
const routes = [
  { 
    path: '/users/:userId(\\d+)',
    component: User
  },
]
```

```js
// vue2
this.$route.params.userId;
// vue3
const route = useRoute()
const id = route.params.id
```



**2. 查询参数**

通过 URL 中的查询字符串传递的参数，以 ?key=value 的形式进行传递。

特点：可以传递多组参数

```js
// 使用 this.$router.push 传递查询参数
this.$router.push({ path: '/user', query: { id: '123' } });

// 获取参数
this.$route.query.id;
```



**3. 路由状态参数**

路由状态参数（Route State Parameters）是一种通过 router.push 或 router.replace 方法传递的参数，这些参数**不会在 URL 中显示**，而是在应用程序的**内存中进行传递**，此方式适合传递一些不希望在 URL 中公开显示的临时数据或敏感信息。

```js
// 传递状态参数
this.$router.push({ path: '/user', state: { id: '123' } });

// 获取参数
history.state.id;
```



**4. 路由props参数**

在路由配置中设置 props: true 或传递一个函数，将路由的 params 或 query 直接作为组件的 props 传递给子组件。

```js
const routes = [{
  path: '/user/:id',
  component: User,
  props: true
}]
```

```vue
<script setup>
defineProps({
  id: {
    // ....
  }
})
</script>
```

Vue3课程《细节补充 - 路由组件传参》



>面试题：Vue 项目中前端路由传参方式有哪些？
>
>参考答案：
>
>Vue 项目中前端路由传参的方式主要有这么几种：
>
>1. 路径参数： 这种方式直观，路径直接反映参数的结构。适合用于需要在路径中明确表示的参数，如资源 ID。
>2. 查询参数：该方式可选参数使用方便，适合用于不确定的参数个数，或者需要在组件间传递较多的参数。
>3. 路由状态参数：参数不会出现在 URL 中，安全性更高，适合用于敏感信息的传递。
>4. 路由props参数：参数直接以 props 形式传入，这样能删除组件对 $route 的直接依赖，达到与 $route 解耦的效果。

---

-EOF-


## *Vue2* 面试题相关

### 1. **谈一谈对 *MVVM* 的理解？**

> 参考答案：
>
> -  *MVVM* 是 *Model-View-ViewModel* 的缩写。*MVVM* 是一种设计思想。
>    - *Model* 层代表数据模型，也可以在 *Model* 中定义数据修改和操作的业务逻辑; 
>    - *View* 代表 *UI* 组件，它负责将数据模型转化成 *UI* 展现出来，*View* 是一个同步 *View* 和 *Model* 的对象
> -  在 *MVVM* 架构下，*View* 和 *Model* 之间并没有直接的联系，而是通过 *ViewModel* 进行交互， *Model* 和 *ViewModel* 之间的交互是双向的， 因此 *View* 数据的变化会同步到 *Model* 中，而 *Model* 数据的变化也会立即反应到 *View* 上。
> -  对 *ViewModel* 通过双向数据绑定把 *View* 层和 *Model* 层连接了起来，而 *View* 和 *Model* 之间的 同步工作完全是自动的，无需人为干涉，因此开发者只需关注业务逻辑，不需要手动操作 *DOM*，不需要关注数据状态的同步问题，复杂的数据状态维护完全由 *MVVM* 来统一管理。



### 2. **说一下 *Vue* 的优点**

> 参考答案：
>
> *Vue* 是一个构建数据驱动的 *Web* 界面的渐进式框架。
>
> *Vue* 的目标是通过尽可能简单的 *API* 实现响应的数据绑定和组合的视图组件。核心是一个响应的数据绑定系统。
>
> 关于 *Vue* 的优点，主要有**响应式编程、组件化开发、虚拟 *DOM***
>
> **响应式编程**
>
> 这里的响应式不是 *@media* 媒体查询中的响应式布局，而是指 *Vue* 会自动对页面中某些数据的变化做出响应。这也就是 *Vue* 最大的优点，通过 *MVVM* 思想实现数据的双向绑定，让开发者不用再操作 *DOM* 对象，有更多的时间去思考业务逻辑。
>
> **组件化开发**
>
> *Vue* 通过组件，把一个单页应用中的各种模块拆分到一个一个单独的组件（*component*）中，我们只要先在父级应用中写好各种组件标签（占坑），并且在组件标签中写好要传入组件的参数（就像给函数传入参数一样，这个参数叫做组件的属性），然后再分别写好各种组件的实现（填坑），然后整个应用就算做完了。
>
> 组件化开发的优点：提高开发效率、方便重复使用、简化调试步骤、提升整个项目的可维护性、便于协同开发。
>
> **虚拟 *DOM***
>
> 在传统开发中，用 *JQuery* 或者原生的 *JavaScript DOM* 操作函数对 *DOM* 进行频繁操作的时候，浏览器要不停的渲染新的 *DOM* 树，导致在性能上面的开销特别的高。
>
> 而 *Virtual DOM* 则是虚拟 *DOM* 的英文，简单来说，他就是一种可以预先通过 *JavaScript* 进行各种计算，把最终的 *DOM* 操作计算出来并优化，由于这个 *DOM* 操作属于预处理操作，并没有真实的操作 *DOM*，所以叫做虚拟 *DOM*。最后在计算完毕才真正将 *DOM* 操作提交，将 *DOM* 操作变化反映到 *DOM* 树上。



### 3. **解释一下对 *Vue* 生命周期的理解**

- 什么是 *vue* 生命周期
- *vue* 生命周期的作用是什么
- *vue* 生命周期有几个阶段
- 第一次页面加载会触发哪几个钩子
- *DOM* 渲染在哪个周期就已经完成
- 多组件（父子组件）中生命周期的调用顺序说一下

> 参考答案：
>
> **什么是 *vue* 生命周期**
>
> 对于 *vue* 来讲，生命周期就是一个 *vue* 实例从创建到销毁的过程。
>
> 
>
> ***vue* 生命周期的作用是什么**
>
> 在生命周期的过程中会运行着一些叫做生命周期的函数，给予了开发者在不同的生命周期阶段添加业务代码的能力。
>
> 其实和回调是一个概念，当系统执行到某处时，检查是否有 *hook*(钩子)，有的话就会执行回调。
>
> 通俗的说，*hook* 就是在程序运行中，在某个特定的位置，框架的开发者设计好了一个钩子来告诉我们当前程序已经运行到特定的位置了，会触发一个回调函数，并提供给我们，让我们可以在生命周期的特定阶段进行相关业务代码的编写。
>
> 
>
> ***vue* 生命周期有几个阶段**
>
> 它可以总共分为 *8* 个阶段：创建前/后, 载入前/后,更新前/后,销毁前/销毁后。
>
> - *beforeCreate*：是 *new Vue( )* 之后触发的第一个钩子，在当前阶段 *data、methods、computed* 以及 *watch* 上的数据和方法都不能被访问。
>
> - *created*：在实例创建完成后发生，当前阶段已经完成了数据观测，也就是可以使用数据，更改数据，在这里更改数据不会触发 *updated* 函数。可以做一些初始数据的获取，在当前阶段无法与 *DOM* 进行交互，如果非要想，可以通过 *vm.$nextTick* 来访问 *DOM* 。
>
> - *beforeMount*：发生在挂载之前，在这之前 *template* 模板已导入渲染函数编译。而当前阶段虚拟 *DOM* 已经创建完成，即将开始渲染。在此时也可以对数据进行更改，不会触发 *updated*。
>
> - *mounted*：在挂载完成后发生，在当前阶段，真实的 *DOM* 挂载完毕，数据完成双向绑定，可以访问到 *DOM* 节点，使用 *$refs* 属性对 *DOM* 进行操作。
>
> - *beforeUpdate*：发生在更新之前，也就是响应式数据发生更新，虚拟 *DOM* 重新渲染之前被触发，你可以在当前阶段进行更改数据，不会造成重渲染。
>
> - *updated*：发生在更新完成之后，当前阶段组件 *DOM* 已完成更新。要注意的是避免在此期间更改数据，因为这可能会导致无限循环的更新。
>
> - *beforeDestroy*：发生在实例销毁之前，在当前阶段实例完全可以被使用，我们可以在这时进行善后收尾工作，比如清除计时器。
>
> - *destroyed*：发生在实例销毁之后，这个时候只剩下了 *DOM* 空壳。组件已被拆解，数据绑定被卸除，监听被移出，子实例也统统被销毁。
>
> 
>
> **第一次页面加载会触发哪几个钩子**
>
> 会触发 *4* 个钩子，分别是：*beforeCreate、created、beforeMount、mounted*
>
> 
>
> ***DOM* 渲染在哪个周期就已经完成**
>
> *DOM* 渲染是在 *mounted* 阶段完成，此阶段真实的 *DOM* 挂载完毕，数据完成双向绑定，可以访问到 *DOM* 节点。
>
> 
>
> **多组件（父子组件）中生命周期的调用顺序说一下**
>
> 组件的调用顺序都是先父后子，渲染完成的顺序是先子后父。组件的销毁操作是先父后子，销毁完成的顺序是先子后父。
>
> - 加载渲染过程：父*beforeCreate*->父*created*->父*beforeMount*->子*beforeCreate*->子*created*->子*beforeMount*- >子*mounted*->父*mounted*
>
> - 子组件更新过程：父*beforeUpdate*->子*beforeUpdate*->子*updated*->父*updated*
>
> - 父组件更新过程：父 *beforeUpdate* -> 父 *updated*
>
> - 销毁过程：父*beforeDestroy*->子*beforeDestroy*->子*destroyed*->父*destroyed*



### 4. ***Vue* 实现双向数据绑定原理是什么？**

> 参考答案：
>
> *Vue2.x* 采用数据劫持结合发布订阅模式（*PubSub* 模式）的方式，通过 *Object.defineProperty* 来劫持各个属性的 *setter、getter*，在数据变动时发布消息给订阅者，触发相应的监听回调。
>
> 当把一个普通 *Javascript* 对象传给 *Vue* 实例来作为它的 *data* 选项时，*Vue* 将遍历它的属性，用 *Object.defineProperty* 将它们转为 *getter/setter*。用户看不到 *getter/setter*，但是在内部它们让 *Vue* 追踪依赖，在属性被访问和修改时通知变化。
>
> *Vue* 的数据双向绑定整合了 *Observer*，*Compile* 和 *Watcher* 三者，通过 *Observer* 来监听自己的 *model* 的数据变化，通过 *Compile* 来解析编译模板指令，最终利用 *Watcher* 搭起 *Observer* 和 *Compile* 之间的通信桥梁，达到数据变化->视图更新，视图交互变化（例如 input 操作）->数据 *model* 变更的双向绑定效果。
>
> *Vue3.x* 放弃了 *Object.defineProperty* ，使用 *ES6* 原生的 *Proxy*，来解决以前使用  *Object.defineProperty* 所存在的一些问题。



### 5. **说一下对 *Vue2.x* 响应式原理的理解**

> 参考答案：
>
> *Vue* 在初始化数据时，会使用 *Object.defineProperty* 重新定义 *data* 中的所有属性，当页面使用对应属性时，首先会进行依赖收集(收集当前组件的 *watcher*)，如果属性发生变化会通知相关依赖进行更新操作(发布订阅)。
>
> （可以参阅前面第 *4* 题答案）



### 6. **说一下在 *Vue2.x* 中如何检测数组的变化？**

> 参考答案：
>
> *Vue2.x* 中实现检测数组变化的方法，是**将数组的常用方法进行了重写**。*Vue* 将 *data* 中的数组进行了原型链重写，指向了自己定义的数组原型方法。这样当调用数组 *api* 时，可以通知依赖更新。如果数组中包含着引用类型，会对数组中的引用类型再次递归遍历进行监控。这样就实现了监测数组变化。
>
> 流程:
>
> 1. 初始化传入 data 数据执行 initData
> 2. 将数据进行观测 new Observer
> 3. 将数组原型方法指向重写的原型
> 4. 深度观察数组中的引用类型
>
> 有两种情况无法检测到数组的变化。
>
> - 当利用索引直接设置一个数组项时，例如 *vm.items[indexOfItem] = newValue*
> - 当修改数组的长度时，例如 *vm.items.length = newLength*
>
> 不过这两种场景都有对应的解决方案。
>
> **利用索引设置数组项的替代方案**
>
> ```js
> //使用该方法进行更新视图
> // vm.$set，Vue.set的一个别名
> vm.$set(vm.items, indexOfItem, newValue)
> ```
>
> **修改数组的长度的替代方案**
>
> ```js
> //使用该方法进行更新视图
> // Array.prototype.splice
> vm.items.splice(indexOfItem, 1, newValue)
> ```



### 7. ***Vue3.x* 响应式数据**

- *Vue3.x* 响应式数据原理是什么？
- *Proxy* 只会代理对象的第一层，那么 *Vue3* 又是怎样处理这个问题的呢？
- 监测数组的时候可能触发多次 *get/set*，那么如何防止触发多次呢？

> 参考答案：
>
> ***Vue3.x* 响应式数据原理是什么？**
>
> 在 *Vue 2* 中，响应式原理就是使用的 *Object.defineProperty* 来实现的。但是在 *Vue 3.0* 中采用了 *Proxy*，抛弃了 *Object.defineProperty* 方法。
>
> 究其原因，主要是以下几点：
>
> - *Object.defineProperty* 无法监控到数组下标的变化，导致通过数组下标添加元素，不能实时响应
> - *Object.defineProperty* 只能劫持对象的属性，从而需要对每个对象，每个属性进行遍历，如果，属性值是对象，还需要深度遍历。*Proxy* 可以劫持整个对象，并返回一个新的对象。
> - *Proxy* 不仅可以代理对象，还可以代理数组。还可以代理动态增加的属性。
> - *Proxy* 有多达 *13* 种拦截方法
> - *Proxy*作为新标准将受到浏览器厂商重点持续的性能优化
>
> 
>
> ***Proxy* 只会代理对象的第一层，那么 *Vue3* 又是怎样处理这个问题的呢？**
>
> 判断当前 *Reflect.get* 的返回值是否为 *Object*，如果是则再通过 *reactive* 方法做代理， 这样就实现了深度观测。
>
> 
>
> **监测数组的时候可能触发多次 *get/set*，那么如何防止触发多次呢？**
>
> 我们可以判断 *key* 是否为当前被代理对象 *target* 自身属性，也可以判断旧值与新值是否相等，只有满足以上两个条件之一时，才有可能执行 *trigger*。



### 8. ***v-model* 双向绑定的原理是什么？**

> 参考答案：
>
> *v-model* 本质就是 *:value + input* 方法的语法糖。可以通过 *model* 属性的 *prop* 和 *event* 属性来进行自定义。原生的 *v-model*，会根据标签的不同生成不同的事件和属性。
>
> 例如：
>
> - *text* 和 *textarea* 元素使用 *value* 属性和 *input* 事件
> - *checkbox* 和 *radio* 使用 *checked* 属性和 *change* 事件
> - *select* 字段将 *value* 作为 *prop* 并将 *change* 作为事件
>
> 以输入框为例，当用户在输入框输入内容时，会触发 *input* 事件，从而更新 *value*。而 *value* 的改变同样会更新视图，这就是 *vue* 中的双向绑定。双向绑定的原理，其实现思路如下：
>
> 首先要对数据进行劫持监听，所以我们需要设置一个监听器 *Observer*，用来监听所有属性。如果属性发上变化了，就需要告诉订阅者 *Watcher* 看是否需要更新。
>
> 因为订阅者是有很多个，所以我们需要有一个消息订阅器 *Dep* 来专门收集这些订阅者，然后在监听器 *Observer* 和订阅者 *Watcher* 之间进行统一管理的。
>
> 接着，我们还需要有一个指令解析器 *Compile*，对每个节点元素进行扫描和解析，将相关指令对应初始化成一个订阅者 *Watcher*，并替换模板数据或者绑定相应的函数，此时当订阅者 *Watcher* 接收到相应属性的变化，就会执行对应的更新函数，从而更新视图。
>
> 因此接下去我们执行以下 *3* 个步骤，实现数据的双向绑定：
>
> 1. 实现一个监听器 *Observer*，用来劫持并监听所有属性，如果有变动的，就通知订阅者。
>
> 2. 实现一个订阅者 *Watcher*，可以收到属性的变化通知并执行相应的函数，从而更新视图。
>
> 3. 实现一个解析器 *Compile*，可以扫描和解析每个节点的相关指令，并根据初始化模板数据以及初始化相应的订阅器。
>
> 流程图如下：
>
> <img src="https://img-blog.csdnimg.cn/img_convert/717034f25ee385b09e9dee53b2988cae.png" alt="img"  />



### 9. ***vue2.x* 和 *vuex3.x* 渲染器的 *diff* 算法分别说一下？**

> 直播讲解

> 参考答案：
>
> 简单来说，*diff* 算法有以下过程
>
> - 同级比较，再比较子节点
> - 先判断一方有子节点一方没有子节点的情况(如果新的 *children* 没有子节点，将旧的子节点移除)
> - 比较都有子节点的情况(核心 *diff*)
> - 递归比较子节点
>
> 正常 *Diff* 两个树的时间复杂度是 *O(n^3)*，但实际情况下我们很少会进行跨层级的移动 *DOM*，所以 *Vue* 将 *Diff* 进行了优化，从*O(n^3) -> O(n)*，只有当新旧 *children* 都为多个子节点时才需要用核心的 *Diff* 算法进行同层级比较。
>
> *Vue2* 的核心 *Diff* 算法采用了双端比较的算法，同时从新旧 *children* 的两端开始进行比较，借助 *key* 值找到可复用的节点，再进行相关操作。相比 *React* 的 *Diff* 算法，同样情况下可以减少移动节点次数，减少不必要的性能损耗，更加的优雅。
>
> *Vue3.x* 借鉴了 *ivi* 算法和 *inferno* 算法
>
> 在创建 *VNode* 时就确定其类型，以及在 *mount/patch* 的过程中采用位运算来判断一个 *VNode* 的类型，在这个基础之上再配合核心的 *Diff* 算法，使得性能上较 *Vue2.x* 有了提升。该算法中还运用了动态规划的思想求解最长递归子序列。



### 10. ***vue* 组件的参数传递**

- 解释一下父组件与子组件传值实现过程
- 非父子组件的数据传递，兄弟组件传值是如何实现的

> 参考答案：
>
> **解释一下父组件与子组件传值实现过程**
>
> - 父组件传给子组件：子组件通过 *props* 方法接受数据
>
> - 子组件传给父组件：使用自定义事件，自组件通过 *$emit* 方法触发父组件的方法来传递参数
>
> 
>
> **非父子组件的数据传递，兄弟组件传值是如何实现的**
>
> *eventBus*，就是创建一个事件中心，相当于中转站，可以用它来传递事件和接收事件。项目比较小时，用这个比较合适。
>
> 
>
> 此外，总结 *vue* 中的组件通信方式，常见使用场景可以分为三类：
>
> - 父子通信：
>   - 父向子传递数据是通过 *props* ，子向父是通过 *$emit / $on*
>   - *$emit / $bus*
>   - *vuex*
>   - 通过父链 / 子链也可以通信（ *$parent / $children* ）
>   - *ref* 也可以访问组件实例
>   - *v-model*
>   - .*sync* 修饰符
> - 兄弟通信：
>   - *$emit / $bus*
>   - *vuex*
> - 跨级通信：
>   - *$emit / $bus* 
>   - *vuex* 
>   - *provide / inject API*
>   - *$attrs/$listeners*



### 11. ***Vue* 的路由实现**

- 解释 *hash* 模式和 *history* 模式的实现原理
- 说一下 *$router* 与 *$route* 的区别
- *vueRouter* 有哪几种导航守卫？
- 解释一下 *vueRouter* 的完整的导航解析流程是什么

> 参考答案：
>
> **解释 *hash* 模式和 *history* 模式的实现原理**
>
> `#` 后面 *hash* 值的变化，不会导致浏览器向服务器发出请求，浏览器不发出请求，就不会刷新页面；通过监听 *hashchange* 事件可以知道 *hash* 发生了哪些变化，然后根据 *hash* 变化来实现更新页面部分内容的操作。
>
> *history* 模式的实现，主要是 *HTML5* 标准发布的两个 *API*，*pushState* 和 *replaceState*，这两个 *API* 可以在改变 *URL*，但是不会发送请求。这样就可以监听 *url* 变化来实现更新页面部分内容的操作。 
>
> 两种模式的区别：
>
> - 首先是在 *URL* 的展示上，*hash* 模式有“#”，*history* 模式没有
>
> - 刷新页面时，*hash* 模式可以正常加载到 *hash* 值对应的页面，而 *history* 没有处理的话，会返回 *404*，一般需要后端将所有页面都配置重定向到首页路由
>
> - 在兼容性上，*hash* 可以支持低版本浏览器和 *IE*
>
> 
>
> **说一下 *$router* 与 *$route* 的区别**
>
> *$route* 对象表示当前的路由信息，包含了当前 *URL* 解析得到的信息。包含当前的路径，参数，*query* 对象等。
>
> - *$route.path*：字符串，对应当前路由的路径，总是解析为绝对路径，如 "/foo/bar"。 
> - *$route.params*： 一个 key/value 对象，包含了 动态片段 和 全匹配片段，如果没有路由参数，就是一个空对象。 
> - *$route.query*：一个 key/value 对象，表示 URL 查询参数。例如对于路径 */foo?user=1*，则有 *$route.query.user == 1*，如果没有查询参数，则是个空对象。 
> - *$route.hash*：当前路由的 hash 值 (不带 #) ，如果没有 *hash* 值，则为空字符串。
> - *$route.fullPath*：完成解析后的 *URL*，包含查询参数和 *hash* 的完整路径。 
> - *$route.matched*：数组，包含当前匹配的路径中所包含的所有片段所对应的配置参数对象。 
> - *$route.name*：当前路径名字 
> - *$route.meta*：路由元信息  
>
> *$route* 对象出现在多个地方:
>
> - 组件内的 *this.$route* 和 *route watcher* 回调（监测变化处理）
> - *router.match(location)* 的返回值
> - *scrollBehavior* 方法的参数
> - 导航钩子的参数，例如 *router.beforeEach* 导航守卫的钩子函数中，*to* 和 *from* 都是这个路由信息对象。
>
> *$router* 对象是全局路由的实例，是 *router* 构造方法的实例。
>
> *$router* 对象常用的方法有：
>
> - *push*：向 *history* 栈添加一个新的记录
> - *go*：页面路由跳转前进或者后退
> - *replace*：替换当前的页面，不会向 *history* 栈添加一个新的记录
>
> 
>
> ***vueRouter* 有哪几种导航守卫？**
>
> - 全局前置/钩子：*beforeEach、beforeR-esolve、afterEach*
>
> - 路由独享的守卫：*beforeEnter*
> - 组件内的守卫：*beforeRouteEnter、beforeRouteUpdate、beforeRouteLeave* 
>
> 
>
> **解释一下 *vueRouter* 的完整的导航解析流程是什么**
>
> 一次完整的导航解析流程如下：
>
> 1. 导航被触发。
> 2. 在失活的组件里调用离开守卫。
> 3. 调用全局的 *beforeEach* 守卫。
> 4. 在重用的组件里调用 *beforeRouteUpdate* 守卫（*2.2+*）。
> 5. 在路由配置里调用 *beforeEnter*。
> 6. 解析异步路由组件。
> 7. 在被激活的组件里调用 *beforeRouteEnter*。
> 8. 调用全局的 *beforeResolve* 守卫（*2.5+*）。
> 9. 导航被确认。
> 10. 调用全局的 *afterEach* 钩子。
> 11. 触发 *DOM* 更新。
> 12. 用创建好的实例调用 *beforeRouteEnter* 守卫中传给 *next* 的回调函数。



### 12. ***vuex* 是什么？怎么使用它？什么场景下我们会使用到 *vuex***

> 参考答案：
>
> ***vuex* 是什么**
>
> *vuex* 是一个专为 *Vue* 应用程序开发的状态管理器，采用集中式存储管理应用的所有组件的状态。每一个 *vuex* 应用的核心就是 *store*（仓库）。“*store*” 基本上就是一个容器，它包含着应用中大部分的状态 (*state*)。
>
> **为什么需要 *vuex***
>
> 由于组件只维护自身的状态(*data*)，组件创建时或者路由切换时，组件会被初始化，从而导致 *data* 也随之销毁。
>
> **使用方法**
>
> 在 *main.js* 引入 *store*，注入。只用来读取的状态集中放在 *store* 中， 改变状态的方式是提交 *mutations*，这是个同步的事物，异步逻辑应该封装在 *action* 中。
>
> **什么场景下会使用到 *vuex***
>
> 如果是 *vue* 的小型应用，那么没有必要使用 *vuex*，这个时候使用 *vuex* 反而会带来负担。组件之间的状态传递使用 *props*、自定义事件来传递即可。
>
> 但是如果涉及到 *vue* 的大型应用，那么就需要类似于 *vuex* 这样的集中管理状态的状态机来管理所有组件的状态。例如登录状态、加入购物车、音乐播放等，总之只要是开发 *vue* 的大型应用，都推荐使用 *vuex* 来管理所有组件状态。



### 13. **说一下 *v-if* 与 *v-show* 的区别**

> 参考答案：
>
> - 共同点：都是动态显示 *DOM* 元素 
>
> - 区别点:
>
>   - 手段
>
>     *v-if* 是动态的向 *DOM* 树内添加或者删除 *DOM* 元素
>
>     *v-show* 是通过设置 *DOM* 元素的 *display* 样式属性控制显隐
>
>   - 编译过程
>
>     *v-if*  切换有一个局部编译/卸载的过程，切换过程中合适地销毁和重建内部的事件监听和子组件
>
>     *v-show* 只是简单的基于 *css* 切换
>
>   - 编译条件
>
>     *v-if*  是惰性的，如果初始条件为假，则什么也不做。只有在条件第一次变为真时才开始局部编译
>
>     *v-show* 是在任何条件下(首次条件是否为真)都被编译，然后被缓存，而且 *DOM* 元素保留
>
>   - 性能消耗
>
>     *v-if*  有更高的切换消耗
>
>     *v-show* 有更高的初始渲染消耗
>
>   - 使用场景
>
>     *v-if*  适合运营条件不大可能改变 
>
>     *v-show* 适合频繁切换



### 14. **如何让 *CSS* 值在当前的组件中起作用**

> 参考答案：
>
> 在 *vue* 文件中的 *style* 标签上，有一个特殊的属性：*scoped*。当一个 style 标签拥有 *scoped* 属性时，它的 *CSS* 样式就只能作用于当前的组件，也就是说，该样式只能适用于当前组件元素。通过该属性，可以使得组件之间的样式不互相污染。如果一个项目中的所有 *style* 标签全部加上了 *scoped*，相当于实现了样式的模块化。
>
> ***scoped* 的实现原理**
>
> *vue* 中的 *scoped* 属性的效果主要通过 *PostCSS* 转译实现的。*PostCSS* 给一个组件中的所有 *DOM* 添加了一个独一无二的动态属性，然后，给 *CSS* 选择器额外添加一个对应的属性选择器来选择该组件中 *DOM*，这种做法使得样式只作用于含有该属性的 *DOM*，即组件内部 *DOM*。
>
> 例如：
>
> 转译前
>
> ```js
> <template>
> <div class="example">hi</div>
> </template>
> 
> <style scoped>
> .example {
> color: red;
> }
> </style>
> ```
>
> 转译后：
>
> ```js
> <template>
> <div class="example" data-v-5558831a>hi</div>
> </template>
> 
> <style>
> .example[data-v-5558831a] {
> color: red;
> }
> </style>
> ```



### 15. ***keep-alive* 相关**

- keep-alive的实现原理是什么
- 与keep-alive相关的生命周期函数是什么，什么场景下会进行使用
- keep-alive的常用属性有哪些

> 参考答案：
>
> keep-alive 组件是 vue 的内置组件，用于缓存内部组件实例。这样做的目的在于，keep-alive 内部的组件切回时，不用重新创建组件实例，而直接使用缓存中的实例，一方面能够避免创建组件带来的开销，另一方面可以保留组件的状态。
>
> keep-alive 具有 include 和 exclude 属性，通过它们可以控制哪些组件进入缓存。另外它还提供了 max 属性，通过它可以设置最大缓存数，当缓存的实例超过该数时，vue 会移除最久没有使用的组件缓存。
>
> 受keep-alive的影响，其内部所有嵌套的组件都具有两个生命周期钩子函数，分别是 activated 和 deactivated，它们分别在组件激活和失活时触发。第一次 activated 触发是在 mounted 之后
>
> 在具体的实现上，keep-alive 在内部维护了一个 key 数组和一个缓存对象
>
> ```js
> // keep-alive 内部的声明周期函数
> created () {
>  this.cache = Object.create(null)
>  this.keys = []
> }
> ```
>
> key 数组记录目前缓存的组件 key 值，如果组件没有指定 key 值，则会为其自动生成一个唯一的 key 值
>
> cache 对象以 key 值为键，vnode 为值，用于缓存组件对应的虚拟 DOM
>
> 在 keep-alive 的渲染函数中，其基本逻辑是判断当前渲染的 vnode 是否有对应的缓存，如果有，从缓存中读取到对应的组件实例；如果没有则将其缓存。
>
> 当缓存数量超过 max 数值时，keep-alive 会移除掉 key 数组的第一个元素。



### 16. ***Vue* 中如何进行组件的使用？*Vue* 如何实现全局组件的注册？**

> 参考答案：
>
> 要使用组件，首先需要使用 *import* 来引入组件，然后在 *components* 属性中注册组件，之后就可以在模板中使用组件了。
>
> 可以使用 *Vue.component* 方法来实现全局组件的注册。



### 17. ***vue-cli* 工程相关**

- 构建 *vue-cli* 工程都用到了哪些技术？他们的作用分别是什么？
- *vue-cli* 工程常用的 *npm* 命令有哪些？

> 参考答案：
>
> **构建 *vue-cli* 工程都用到了哪些技术？他们的作用分别是什么？**
>
> 1. vue.js：vue-cli 工程的核心，主要特点是双向数据绑定和组件系统。
> 2. vue-router：vue 官方推荐使用的路由框架。
> 3. vuex：专为 Vue.js 应用项目开发的状态管理器，主要用于维护 vue 组件间共用的一些 变量 和 方法。
> 4. axios（或者 fetch、ajax）：用于发起 GET 、或 POST 等 http请求，基于 Promise 设计。
> 5. vux等：一个专为vue设计的移动端UI组件库。
> 6. webpack：模块加载和vue-cli工程打包器。
> 7. eslint：代码规范工具
>
> 
>
> ***vue-cli* 工程常用的 *npm* 命令有哪些？**
>
> 下载 node_modules 资源包的命令：npm install
>
> 启动 vue-cli 开发环境的 npm命令：npm run dev
>
> vue-cli 生成 生产环境部署资源 的 npm命令：npm run build
>
> 用于查看 vue-cli 生产环境部署资源文件大小的 npm命令：npm run build --report



### 18. ***nextTick* 的作用是什么？他的实现原理是什么？**

> 参考答案：
>
> 作用：*vue* 更新 *DOM* 是异步更新的，数据变化，*DOM* 的更新不会马上完成，*nextTick* 的回调是在下次 *DOM* 更新循环结束之后执行的延迟回调。
>
> 实现原理：*nextTick* 主要使用了宏任务和微任务。根据执行环境分别尝试采用
>
> - *Promise*：可以将函数延迟到当前函数调用栈最末端
> - *MutationObserver* ：是 *H5* 新加的一个功能，其功能是监听 *DOM* 节点的变动，在所有 *DOM* 变动完成后，执行回调函数
> - *setImmediate*：用于中断长时间运行的操作，并在浏览器完成其他操作（如事件和显示更新）后立即运行回调函数
> - 如果以上都不行则采用 *setTimeout* 把函数延迟到 DOM 更新之后再使用
>
> 原因是宏任务消耗大于微任务，优先使用微任务，最后使用消耗最大的宏任务。



### 19. **说一下 *Vue SSR* 的实现原理**

> 参考答案：
>
> - *app.js* 作为客户端与服务端的公用入口，导出 *Vue* 根实例，供客户端 *entry* 与服务端 *entry* 使用。客户端 *entry* 主要作用挂载到 *DOM* 上，服务端 *entry* 除了创建和返回实例，还需要进行路由匹配与数据预获取。
> - *webpack* 为客服端打包一个 *ClientBundle*，为服务端打包一个 *ServerBundle*。
> - 服务器接收请求时，会根据 *url*，加载相应组件，获取和解析异步数据，创建一个读取 *Server Bundle* 的 *BundleRenderer*，然后生成 *html* 发送给客户端。
> - 客户端混合，客户端收到从服务端传来的 *DOM* 与自己的生成的 *DOM* 进行对比，把不相同的 *DOM* 激活，使其可以能够响应后续变化，这个过程称为客户端激活（也就是转换为单页应用）。为确保混合成功，客户 端与服务器端需要共享同一套数据。在服务端，可以在渲染之前获取数据，填充到 *store* 里，这样，在客户端挂载到 *DOM* 之前，可以直接从 *store* 里取数据。首屏的动态数据通过 *window.\__INITIAL_STATE__* 发送到客户端
> - *VueSSR* 的原理，主要就是通过 *vue-server-renderer* 把 *Vue* 的组件输出成一个完整 *HTML*，输出到客户端，到达客户端后重新展开为一个单页应用。



### 20. ***Vue* 组件的 *data* 为什么必须是函数**

> 参考答案：
>
> 组件中的 *data* 写成一个函数，数据以函数返回值形式定义。这样每复用一次组件，就会返回一份新的 *data*，类似于给每个组件实例创建一个私有的数据空间，让各个组件实例维护各自的数据。而单纯的写成对象形式，就使得所有组件实例共用了一份 *data*，就会造成一个变了全都会变的结果。



### 21. **说一下 *Vue* 的 *computed* 的实现原理**

> 参考答案：
>
> 当组件实例触发生命周期函数 *beforeCreate* 后，它会做一系列事情，其中就包括对 *computed* 的处理。
>
> 它会遍历 *computed* 配置中的所有属性，为每一个属性创建一个 *Watcher* 对象，并传入一个函数，该函数的本质其实就是 *computed* 配置中的 *getter*，这样一来，*getter* 运行过程中就会收集依赖
>
> 但是和渲染函数不同，为计算属性创建的 *Watcher* 不会立即执行，因为要考虑到该计算属性是否会被渲染函数使用，如果没有使用，就不会得到执行。因此，在创建 *Watcher* 的时候，它使用了 *lazy* 配置，*lazy* 配置可以让 *Watcher* 不会立即执行。
>
> 收到 *lazy* 的影响，*Watcher* 内部会保存两个关键属性来实现缓存，一个是 *value*，一个是 *dirty*
>
> *value* 属性用于保存 *Watcher* 运行的结果，受 *lazy* 的影响，该值在最开始是 *undefined*
>
> *dirty* 属性用于指示当前的 *value* 是否已经过时了，即是否为脏值，受 *lazy* 的影响，该值在最开始是 *true*
>
> Watcher 创建好后，vue 会使用代理模式，将计算属性挂载到组件实例中
>
> 当读取计算属性时，*vue* 检查其对应的 *Watcher* 是否是脏值，如果是，则运行函数，计算依赖，并得到对应的值，保存在 *Watcher* 的 *value* 中，然后设置 *dirty* 为 *false*，然后返回。
>
> 如果 *dirty* 为 *false*，则直接返回 *watcher* 的 *value*
>
> 巧妙的是，在依赖收集时，被依赖的数据不仅会收集到计算属性的 *Watcher*，还会收集到组件的 *Watcher*
>
> 当计算属性的依赖变化时，会先触发计算属性的 *Watcher* 执行，此时，它只需设置 *dirty* 为 *true* 即可，不做任何处理。
>
> 由于依赖同时会收集到组件的 *Watcher*，因此组件会重新渲染，而重新渲染时又读取到了计算属性，由于计算属性目前已为 dirty，因此会重新运行 *getter* 进行运算
>
> 而对于计算属性的 *setter*，则极其简单，当设置计算属性时，直接运行 *setter* 即可。



### 22. **说一下 *Vue complier* 的实现原理是什么样的？**

> 参考答案：
>
> 在使用 vue 的时候，我们有两种方式来创建我们的 HTML 页面，第一种情况，也是大多情况下，我们会使用模板 template 的方式，因为这更易读易懂也是官方推荐的方法；第二种情况是使用 render 函数来生成 HTML，它比 template 更接近最终结果。
>
> complier 的主要作用是解析模板，生成渲染模板的 *render*， 而 *render* 的作用主要是为了生成 *VNode*
>
> complier 主要分为 3 大块：
>
> - parse：接受 template 原始模板，按着模板的节点和数据生成对应的 ast
> - optimize：遍历 ast 的每一个节点，标记静态节点，这样就知道哪部分不会变化，于是在页面需要更新时，通过 diff 减少去对比这部分DOM，提升性能
> - generate 把前两步生成完善的 ast，组成 render 字符串，然后将 render 字符串通过 new Function 的方式转换成渲染函数



### 23. ***vue* 如何快速定位那个组件出现性能问题的**

> 参考答案：
>
> ⽤ *timeline* ⼯具。 通过 *timeline* 来查看每个函数的调⽤时常，定位出哪个函数的问题，从⽽能判断哪个组件出了问题。



### 24. ***Proxy* 相比 *defineProperty* 的优势在哪里**

> 参考答案：
>
> *Vue3.x* 改用 *Proxy* 替代 *Object.defineProperty*
>
> 原因在于 *Object.defineProperty* 本身存在的一些问题：
>
> - *Object.defineProperty* 只能劫持对象属性的 *getter* 和 *setter* 方法。
> - *Object.definedProperty* 不支持数组(可以监听数组,不过数组方法无法监听自己重写)，更准确的说是不支持数组的各种 *API*(所以 *Vue* 重写了数组方法。
>
> 而相比  *Object.defineProperty*，*Proxy* 的优点在于：
>
> - *Proxy* 是直接代理劫持整个对象。
> - *Proxy* 可以直接监听对象和数组的变化，并且有多达 *13* 种拦截方法。
>
> 目前，*Object.definedProperty* 唯一比 *Proxy* 好的一点就是兼容性，不过 *Proxy* 新标准也受到浏览器厂商重点持续的性能优化当中。



### 25. ***Vue* 与 *Angular* 以及 *React* 的区别是什么？**

> 参考答案：
>
> 这种题目是开放性题目，一般是面试过程中面试官口头来提问，不太可能出现在笔试试卷里面。
>
> 关于 *Vue* 和其他框架的不同，官方专门写了一篇文档，从性能、体积、灵活性等多个方面来进行了说明。
>
> 详细可以参阅：*https://cn.vuejs.org/v2/guide/comparison.html*
>
> 建议面试前通读一遍该篇文档，然后进行适当的总结。



### 26. **说一下 *watch* 与 *computed* 的区别是什么？以及他们的使用场景分别是什么？**

> 参考答案：
>
> 区别：
>
> 1. 都是观察数据变化的（相同）
> 2. 计算属性将会混入到 vue 的实例中，所以需要监听自定义变量；watch 监听 data 、props 里面数据的变化；
> 3. computed 有缓存，它依赖的值变了才会重新计算，watch 没有；
> 4. watch 支持异步，computed 不支持；
> 5. watch 是一对多（监听某一个值变化，执行对应操作）；computed 是多对一（监听属性依赖于其他属性）
> 6. watch 监听函数接收两个参数，第一个是最新值，第二个是输入之前的值；
> 7. computed 属性是函数时，都有 get 和 set 方法，默认走 get 方法，get 必须有返回值（return）
>
> watch 的 参数：
>
> - deep：深度监听
> - immediate ：组件加载立即触发回调函数执行
>
> computed 缓存原理：
>
> conputed本质是一个惰性的观察者；当计算数据存在于 data 或者 props里时会被警告；
>
> vue 初次运行会对 computed 属性做初始化处理（initComputed），初始化的时候会对每一个 computed 属性用 watcher 包装起来 ，这里面会生成一个 dirty 属性值为 true；然后执行 defineComputed 函数来计算，计算之后会将 dirty 值变为 false，这里会根据 dirty 值来判断是否需要重新计算；如果属性依赖的数据发生变化，computed 的 watcher 会把 dirty 变为 true，这样就会重新计算 computed 属性的值。



### 27. ***scoped* 是如何实现样式穿透的？**

> 参考答案：
>
> 首先说一下什么场景下需要 *scoped* 样式穿透。
>
> 在很多项目中，会出现这么一种情况，即：引用了第三方组件，需要在组件中局部修改第三方组件的样式，而又不想去除 *scoped* 属性造成组件之间的样式污染。此时只能通过特殊的方式，穿透 *scoped*。
>
> 有三种常用的方法来实现样式穿透。
>
> **方法一**
>
> 使用 *::v-deep* 操作符( >>> 的别名)
>
> 如果希望 *scoped* 样式中的一个选择器能够作用得“更深”，例如影响子组件，可以使用 >>> 操作符：
>
> ```js
> <style scoped>
>  .a >>> .b { /* ... */ }
> </style>
> ```
>
> 上述代码将会编译成：
>
> ```js
> .a[data-v-f3f3eg9] .b { /* ... */ }
> ```
>
> 后面的类名没有 *data* 属性，所以能选到子组件里面的类名。
>
> 有些像 *Sass* 之类的预处理器无法正确解析 >>>，所以需要使用 *::v-deep* 操作符来代替。
>
> **方法二**
>
> 定义一个含有 *scoped* 属性的 *style* 标签之外，再定义一个不含有 *scoped* 属性的 *style* 标签，即在一个 *vue* 组件中定义一个全局的 *style* 标签，一个含有作用域的 *style* 标签：
>
> ```js
> <style>
> /* global styles */
> </style>
> 
> <style scoped>
> /* local styles */
> </style>
> ```
>
> 此时，我们只需要将修改第三方样式的 *css* 写在第一个 *style* 中即可。
>
> **方法三**
>
> 上面的方法一需要单独书写一个不含有 *scoped* 属性的 *style* 标签，可能会造成全局样式的污染。
>
> 更推荐的方式是在组件的外层 *DOM* 上添加唯一的 *class* 来区分不同组件，在书写样式时就可以正常针对针对这部分 *DOM* 书写样式。



### 28. **说一下 *ref* 的作用是什么？**

> 参考答案：
>
> *ref* 的作用是被用来给元素或子组件注册引用信息。引用信息将会注册在父组件的 *$refs* 对象上。其特点是：
>
> - 如果在普通的 *DOM* 元素上使用，引用指向的就是 *DOM* 元素
> - 如果用在子组件上，引用就指向组件实例
>
> 所以常见的使用场景有：
>
> 1. 基本用法，本页面获取 *DOM* 元素
> 2. 获取子组件中的 *data*
> 3. 调用子组件中的方法



### 29. **说一下你知道的 *vue* 修饰符都有哪些？**

> 参考答案：
>
> 在 *vue* 中修饰符可以分为 *3* 类：
>
> - 事件修饰符
> - 按键修饰符
> - 表单修饰符
>
> **事件修饰符**
>
> 在事件处理程序中调用 *event.preventDefault* 或 *event.stopPropagation* 方法是非常常见的需求。尽管可以在 *methods* 中轻松实现这点，但更好的方式是：*methods* 只有纯粹的数据逻辑，而不是去处理 *DOM* 事件细节。
>
> 为了解决这个问题，*vue* 为 *v-on* 提供了事件修饰符。通过由点 *.* 表示的指令后缀来调用修饰符。
>
> 常见的事件修饰符如下：
>
> - *.stop*：阻止冒泡。
> - *.prevent*：阻止默认事件。
> - *.capture*：使用事件捕获模式。
> - *.self*：只在当前元素本身触发。
> - *.once*：只触发一次。
> - *.passive*：默认行为将会立即触发。
>
> **按键修饰符**
>
> 除了事件修饰符以外，在 *vue* 中还提供了有鼠标修饰符，键值修饰符，系统修饰符等功能。
>
> - .*left*：左键
> - .*right*：右键
> - .*middle*：滚轮
> - .*enter*：回车
> - .*tab*：制表键
> - .*delete*：捕获 “删除” 和 “退格” 键
> - .*esc*：返回
> - .*space*：空格
> - .*up*：上
> - .*down*：下
> - .*left*：左
> - .*right*：右
> - .*ctrl*：*ctrl* 键
> - .*alt*：*alt* 键
> - .*shift*：*shift* 键
> - .*meta*：*meta* 键
>
> **表单修饰符**
>
> *vue* 同样也为表单控件也提供了修饰符，常见的有 *.lazy*、*.number* 和 *.trim*。
>
> - .*lazy*：在文本框失去焦点时才会渲染
> - .*number*：将文本框中所输入的内容转换为number类型
> - .*trim*：可以自动过滤输入首尾的空格



### 30. **如何实现 *vue* 项目中的性能优化？**

> 直播课讲解

> 参考答案：
>
> **编码阶段**
>
> - 尽量减少 *data* 中的数据，*data* 中的数据都会增加 *getter* 和 *setter*，会收集对应的 *watcher*
> - *v-if* 和 *v-for* 不能连用
> - 如果需要使用 *v-for* 给每项元素绑定事件时使用事件代理
> - *SPA* 页面采用 *keep-alive* 缓存组件
> - 在更多的情况下，使用 *v-if* 替代 *v-show*
> - *key* 保证唯一
> - 使用路由懒加载、异步组件
> - 防抖、节流
> - 第三方模块按需导入
> - 长列表滚动到可视区域动态加载
> - 图片懒加载
>
> ***SEO* 优化**
>
> - 预渲染
> - 服务端渲染 *SSR*
>
> **打包优化**
>
> - 压缩代码
> - *Tree Shaking/Scope Hoisting*
> - 使用 *cdn* 加载第三方模块
> - 多线程打包 *happypack*
> - *splitChunks* 抽离公共文件
> - *sourceMap* 优化
>
> **用户体验**
>
> - 骨架屏
> - *PWA*
>
> 还可以使用缓存(客户端缓存、服务端缓存)优化、服务端开启 *gzip* 压缩等。



### 31. ***Vue.extend* 和 *Vue.component* 的区别是什么？**

> 参考答案：
>
> *Vue.extend* 用于创建一个基于 *Vue* 构造函数的“子类”，其参数应为一个包含组件选项的对象。
>
> *Vue.component* 用来注册全局组件。



### 32. ***vue* 中的 *spa* 应用如何优化首屏加载速度?**

> 参考答案：
>
> 优化首屏加载可以从这几个方面开始：
>
> - 请求优化：CDN 将第三方的类库放到 CDN 上，能够大幅度减少生产环境中的项目体积，另外 CDN 能够实时地根据网络流量和各节点的连接、负载状况以及到用户的距离和响应时间等综合信息将用户的请求重新导向离用户最近的服务节点上。
> - 缓存：将长时间不会改变的第三方类库或者静态资源设置为强缓存，将 max-age 设置为一个非常长的时间，再将访问路径加上哈希达到哈希值变了以后保证获取到最新资源，好的缓存策略有助于减轻服务器的压力，并且显著的提升用户的体验
> - gzip：开启 gzip 压缩，通常开启 gzip 压缩能够有效的缩小传输资源的大小。
> - http2：如果系统首屏同一时间需要加载的静态资源非常多，但是浏览器对同域名的 tcp 连接数量是有限制的(chrome 为 6 个)超过规定数量的 tcp 连接，则必须要等到之前的请求收到响应后才能继续发送，而 http2 则可以在多个 tcp 连接中并发多个请求没有限制，在一些网络较差的环境开启 http2 性能提升尤为明显。
> - 懒加载：当 url 匹配到相应的路径时，通过 import 动态加载页面组件，这样首屏的代码量会大幅减少，webpack 会把动态加载的页面组件分离成单独的一个 chunk.js 文件
> - 预渲染：由于浏览器在渲染出页面之前，需要先加载和解析相应的 html、css 和 js 文件，为此会有一段白屏的时间，可以添加loading，或者骨架屏幕尽可能的减少白屏对用户的影响体积优化
> - 合理使用第三方库：对于一些第三方 ui 框架、类库，尽量使用按需加载，减少打包体积
> - 使用可视化工具分析打包后的模块体积：webpack-bundle- analyzer 这个插件在每次打包后能够更加直观的分析打包后模块的体积，再对其中比较大的模块进行优化
> - 提高代码使用率：利用代码分割，将脚本中无需立即调用的代码在代码构建时转变为异步加载的过程
> - 封装：构建良好的项目架构，按照项目需求就行全局组件，插件，过滤器，指令，utils 等做一 些公共封装，可以有效减少我们的代码量，而且更容易维护资源优化
> - 图片懒加载：使用图片懒加载可以优化同一时间减少 http 请求开销，避免显示图片导致的画面抖动，提高用户体验
> - 使用 svg 图标：相对于用一张图片来表示图标，svg 拥有更好的图片质量，体积更小，并且不需要开启额外的 http 请求
> - 压缩图片：可以使用 image-webpack-loader，在用户肉眼分辨不清的情况下一定程度上压缩图片



### 33. **移动端如何实现一个比较友好的 *header* 组件**

> 参考答案：
>
> *Header* 一般分为左、中、右三个部分，分为三个区域来设计，中间为主标题，每个页面的标题肯定不同，所以可以通过 *vue props*的方式做成可配置对外进行暴露，左侧大部分页面可能都是回退按钮，但是样式和内容不尽相同，右侧一般都是具有功能性的操作按钮，所以左右两侧可以通过 *vue slot* 插槽的方式对外暴露以实现多样化，同时也可以提供 *default slot* 默认插槽来统一页面风格。



### 34. **既然 *Vue* 通过数据劫持可以精准探测数据变化，为什么还需要虚拟 *DOM* 进行 *diff* 监测差异 ？**

> 参考答案：
>
> 现代前端框架有两种方式侦测变化，一种是 *pull*，一种是 *push*。
>
> ***pull***
>
> 其代表为 *React*，我们可以回忆一下 *React* 是如何侦测到变化的。
>
> 我们通常会用 *setState API* 显式更新,然后 *React* 会进行一层层的 *Virtual Dom Diff* 操作找出差异，然后 *Patch* 到 *DOM* 上，*React* 从一开始就不知道到底是哪发生了变化,只是知道「有变化了」,然后再进行比较暴力的 *Diff* 操作查找「哪发生变化了」，另外一个代表就是 *Angular* 的脏检查操作。
>
> ***push***
>
> *Vue* 的响应式系统则是 *push* 的代表，当 *Vue* 程序初始化的时候就会对数据 *data* 进行依赖的收集，一但数据发生变化，响应式系统就会立刻得知，因此 *Vue* 是一开始就知道是「在哪发生变化了」
>
> 但是这又会产生一个问题，通常绑定一个数据就需要一个 *Watcher*，一但我们的绑定细粒度过高就会产生大量的 *Watcher*，这会带来内存以及依赖追踪的开销，而细粒度过低会无法精准侦测变化，因此 *Vue* 的设计是选择中等细粒度的方案，在组件级别进行 *push* 侦测的方式，也就是那套响应式系统。
>
> 通常我们会第一时间侦测到发生变化的组件,然后在组件内部进行 *Virtual Dom Diff* 获取更加具体的差异，而 *Virtual Dom Diff* 则是 *pull* 操作，*Vue* 是 *push + pull* 结合的方式进行变化侦测的。



### 35. ***Vue* 为什么没有类似于 *React* 中 *shouldComponentUpdate* 的生命周期？**

> 参考答案：
>
> 根本原因是 *Vue* 与 *React* 的变化侦测方式有所不同
>
> *React* 是 *pull* 的方式侦测变化，当 *React* 知道发生变化后，会使用 *Virtual Dom Diff* 进行差异检测,但是很多组件实际上是肯定不会发生变化的，这个时候需要用 *shouldComponentUpdate* 进行手动操作来减少 *diff*，从而提高程序整体的性能。
>
> *Vue* 是 *pull+push* 的方式侦测变化的，在一开始就知道那个组件发生了变化，因此在 *push* 的阶段并不需要手动控制 *diff*，而组件内部采用的 *diff* 方式实际上是可以引入类似于 *shouldComponentUpdate* 相关生命周期的，但是通常合理大小的组件不会有过量的 *diff*，手动优化的价值有限，因此目前 *Vue* 并没有考虑引入 *shouldComponentUpdate* 这种手动优化的生命周期。



### 36. ***Vue* 中的 *Key* 的作用是什么？**

> 参考答案：
>
> ***key* 的作用主要是为了高效的更新虚拟 *DOM***。另外 *vue* 中在使用相同标签名元素的过渡切换时，也会使用到 *key* 属性，其目的也是为了让 *vue* 可以区分它们，否则 *vue* 只会替换其内部属性而不会触发过渡效果。

> 解析：
>
> 其实不只是 *vue*，*react* 中在执行列表渲染时也会要求给每个组件添加上 *key* 这个属性。
>
> 要解释 *key* 的作用，不得不先介绍一下虚拟 *DOM* 的 *Diff* 算法了。
>
> 我们知道，*vue* 和 *react* 都实现了一套虚拟 *DOM*，使我们可以不直接操作 *DOM* 元素，只操作数据便可以重新渲染页面。而隐藏在背后的原理便是其高效的 *Diff* 算法。
>
> *vue* 和 *react* 的虚拟 *DOM* 的 *Diff* 算法大致相同，其核心有以下两点：
>
> - 两个相同的组件产生类似的 *DOM* 结构，不同的组件产生不同的 *DOM* 结构。
>
> - 同一层级的一组节点，他们可以通过唯一的 *id* 进行区分。
>
> 基于以上这两点，使得虚拟 *DOM* 的 *Diff* 算法的复杂度从 *O(n^3)* 降到了 *O(n)*。
>
> <img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2021-08-21-062058.png" alt="image-20210821142057777" style="zoom:50%;" />
>
> 当页面的数据发生变化时，*Diff* 算法只会比较同一层级的节点：
>
> - 如果节点类型不同，直接干掉前面的节点，再创建并插入新的节点，不会再比较这个节点以后的子节点了。
> - 如果节点类型相同，则会重新设置该节点的属性，从而实现节点的更新。
>
> 当某一层有很多相同的节点时，也就是列表节点时，*Diff* 算法的更新过程默认情况下也是遵循以上原则。
>
> 比如一下这个情况：
>
> ![img](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2021-08-21-062225.jpg)
>
> 我们希望可以在 *B* 和 *C* 之间加一个 *F*，*Diff* 算法默认执行起来是这样的：
>
> ![img](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2021-08-21-062244.jpg)
>
> 即把 *C* 更新成 *F*，*D* 更新成 *C*，*E* 更新成 *D*，最后再插入 *E*
>
> 是不是很没有效率？
>
> 所以我们需要使用 *key* 来给每个节点做一个唯一标识，*Diff* 算法就可以正确的识别此节点，找到正确的位置区插入新的节点。
>
> ![img](https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2021-08-21-062321.jpg)



### 37. **你的接口请求一般放在哪个生命周期中？为什么要这样做？**

> 参考答案：
>
> 接口请求可以放在钩子函数 *created、beforeMount、mounted* 中进行调用，因为在这三个钩子函数中，*data* 已经创建，可以将服务端端返回的数据进行赋值。
>
> 但是推荐在 *created* 钩子函数中调用异步请求，因为在 *created* 钩子函数中调用异步请求有以下优点：
>
> - 能更快获取到服务端数据，减少页面 *loading* 时间
> - *SSR* 不支持 *beforeMount 、mounted* 钩子函数，所以放在 *created* 中有助于代码的一致性
> - *created* 是在模板渲染成 *html* 前调用，即通常初始化某些属性值，然后再渲染成视图。如果在 *mounted* 钩子函数中请求数据可能导致页面闪屏问题 



### 38. **说一下你对 *vue* 事件绑定原理的理解？**

> 参考答案：
>
> *vue* 中的事件绑定是有两种，一种是原生的事件绑定，另一种是组件的事件绑定。
>
> 原生的事件绑定在普通元素上是通过 *@click* 进行绑定，在组件上是通过 *@click.native* 进行绑定，组件中的 *nativeOn* 是等价于 on 的。组件的事件绑定的 @click 是 vue 中自定义的 $on 方法来实现的，必须有 $emit 才可以触发。
>
> **原生事件绑定原理**
>
> 在 runtime下的patch.js中createPatchFunction执行了之后再赋值给patch。
>
> createPatchFunction方法有两个参数，分别是nodeOps存放操作dom节点的方法和modules，modules是有两个数组拼接起来的，modules拼接完的数组中有一个元素就是events，事件添加就发生在这里。
>
> events元素关联的就是events.js文件，在events中有一个updateDOMListeners方法，在events文件的结尾导出了一个对象，然后对象有一个属性叫做create，这个属性关联的就是updateDOMListeners方法。
>
> 在执行createPatchFunction方法时，就会将这两个参数传入，在createPatchFunction方法中接收了一个参数backend，在该方法中一开始进行backend的解构，就是上面的nodeOps和modules参数，解构完之后进入for循环。
>
> 在createPatchFunction开头定义了一个cbs对象。for循环遍历一个叫hooks的数组。hooks是文件一开头定义的一个数组，其中包括有create，for循环就是在cbs上定义一系列和hooks元素相同的属性，然后键值是一个数组，然后数组内容是modules里面的一些内容。这时就把events文件中导出来的create属性放在了cbs上。
>
> 当我们进入首次渲染的时候，会执行到patch函数里面的createElm方法，这个方法中就会调用invokeCreateHooks函数，用来处理事件系统，这里就是真正准备进行原生事件绑定的入口。invokeCreateHooks方法中，遍历了cbs.create数组里面的内容。然后把cbs.create里面的函数全部都执行一次，在cbs.create其中一个函数就是updateDOMListeners。
>
> updateDOMListeners就是用来添加事件的方法，在这方法中会根据vnode判断是否有定义一个点击事件。如果没有点击事件就return。有的话就继续执行，给on进行赋值，然后进行一些赋值操作，将vnode.elm赋值给target，elm这个属性就是指向vnode所对应的真实dom节点，这里就是把我们要绑定事件的dom结点进行缓存，接下来执行updateListeners方法。在接下来执行updateListeners方法中调用了一个add的方法，然后在app方法中通过原生addEventListener把事件绑定到dom上。
>
> **组件事件绑定原理**
>
> 在组件实例初始化会调用initMixin方法中的Vue.prototype._init，在init函数中，会通过initInternalComponent方法初始化组件信息，将自定义的组件事件放到_parentListeners上，下来就会调用initEvents来初始化组件事件，在initEvents中会实例上添加一个 _event对象，用于保存自定义事件，然后获取到 父组件给 子组件绑定的自定义事件，也就是刚才在初始化组件信息的时候将自定义的组件事件放在了_parentListeners上，这时候vm.$options._parentListeners就是自定义的事件。
>
> 最后进行判断，如果有自定义的组件事件就执行updateComponentListeners方法进行事件绑定，在updateComponentListeners方法中会调用updateListeners方法，并传传一个add方法进行执行，这个add方法里就是$on方法。



### 39. **说一下 *vue* 模版编译的原理是什么**

> 参考答案：
>
> 简单说，*Vue* 的编译过程就是将 *template* 转化为 *render* 函数的过程。会经历以下阶段：
>
> - 生成 *AST* 树
> - 优化
> - *codegen*
>
> 首先解析模版，生成 *AST* 语法树(一种用 *JavaScript* 对象的形式来描述整个模板)。 使用大量的正则表达式对模板进行解析，遇到标签、文本的时候都会执行对应的钩子进行相关处理。
>
> *Vue* 的数据是响应式的，但其实模板中并不是所有的数据都是响应式的。有一些数据首次渲染后就不会再变化，对应的 *DOM* 也不会变化。那么优化过程就是深度遍历 *AST* 树，按照相关条件对树节点进行标记。这些被标记的节点(静态节点)我们就可以跳过对它们的比对，对运行时的模板起到很大的优化作用。
>
> 编译的最后一步是将优化后的 *AST* 树转换为可执行的代码。

> 可以参阅前面第 *22* 题。



### 40. ***delete* 和 *Vue.delete* 删除数组的区别是什么？**

> 参考答案：
>
> *delete* 只是被删除的元素变成了 *empty/undefined* 其他的元素的键值还是不变。
> *Vue.delete* 是直接将元素从数组中完全删除，改变了数组其他元素的键值。



### 41. ***v-on* 可以实现监听多个方法么？**

> 参考答案：
>
> 可以监听多个方法。关于监听多个方法提供了几种不同的写法：
>
> ```html
> 写法一：<div v-on="{ 事件类型: 事件处理函数, 事件类型: 事件处理函数 }"></div>
> 写法二：<div @事件类型=“事件处理函数” @事件类型=“事件处理函数”></div>
> 写法三：在一个事件里面书写多个事件处理函数
> <div @事件类型=“事件处理函数1，事件处理函数2”></div>
> 写法四：在事件处理函数内部调用其他的函数
> ```
>
> 示例代码如下：
>
> ```html
> <template>
> <div>
>  <!-- v-on在vue2.x中测试,以下两种均可-->
>  <button v-on="{ mouseenter: onEnter, mouseleave: onLeave }">
>    鼠标进来1
>  </button>
>  <button @mouseenter="onEnter" @mouseleave="onLeave">鼠标进来2</button>
> 
>  <!-- 一个事件绑定多个函数，按顺序执行，这里分隔函数可以用逗号也可以用分号-->
>  <button @click="a(), b()">点我ab</button>
>  <button @click="one()">点我onetwothree</button>
> </div>
> </template>
> <script>
> export default {
> methods: {
>  //这里是es6对象里函数写法
>  a() {
>    console.log("a");
>  },
>  b() {
>    console.log("b");
>  },
>  one() {
>    console.log("one");
>    this.two();
>    this.three();
>  },
>  two() {
>    console.log("two");
>  },
>  three() {
>    console.log("three");
>  },
>  onEnter() {
>    console.log("mouse enter");
>  },
>  onLeave() {
>    console.log("mouse leave");
>  },
> },
> };
> </script>
> ```



### 42. ***vue* 的数据为什么频繁变化但只会更新一次？**

> 参考答案：
>
> 这是因为 *vue* 的 *DOM* 更新是一个异步操作，在数据更新后会首先被 *set* 钩子监听到，但是不会马上执行 *DOM* 更新，而是在下一轮循环中执行更新。
>
> 具体实现是 *vue* 中实现了一个 *queue* 队列用于存放本次事件循环中的所有 *watcher* 更新，并且同一个 *watcher* 的更新只会被推入队列一次，并在本轮事件循环的微任务执行结束后执行此更新(*UI Render* 阶段)，这就是 *DOM* 只会更新一次的原因。
>
> 这种在缓冲时去除重复数据对于避免不必要的计算和 *DOM* 操作是非常重要的。然后，在下一个的事件循环“*tick*”中，*vue* 刷新队列并执行实际 (已去重的) 工作。*vue* 在内部对异步队列尝试使用原生的 *Promise.then、MutationObserver*  和 *setImmediate*，如果执行环境不支持，则会采用 *setTimeout(fn, 0)* 代替。



### 43. **说一下 *vue* 中 *computed* 和 *methods* 的区别是什么？**

> 参考答案：
>
> 首先从表现形式上面来看， *computed* 和 *methods* 的区别大致有下面 *4* 点：
>
> 1. 在使用时，*computed* 当做属性使用，而 *methods* 则当做方法调用
> 2. *computed* 可以具有 *getter* 和 *setter*，因此可以赋值，而 *methods* 不行
> 3. *computed* 无法接收多个参数，而 *methods* 可以
> 4. *computed* 具有缓存，而 *methods* 没有
>
> 而如果从底层来看的话， *computed* 和 *methods* 在底层实现上面还有很大的区别。
>
> *vue* 对 *methods* 的处理比较简单，只需要遍历 *methods* 配置中的每个属性，将其对应的函数使用 *bind* 绑定当前组件实例后复制其引用到组件实例中即可
>
> 而 *vue* 对 *computed* 的处理会稍微复杂一些。
>
> 具体可以参阅前面第 *21* 题。



### 44. **在 *Vue* 中要获取当前时间你会放到 *computed* 还是 *methods* 里？(抖音直播)**

> 参考答案：
>
> 放在 *computed* 里面。因为 *computed* 只有在它的相关依赖发生改变时才会重新求值。相比而言，方法只要发生重新渲染，*methods* 调用总会执行所有函数。 



### 45. **在给 *vue* 中的元素设置 *key* 值时可以使用 *Math* 的 *random* 方法么？**

>参考答案：
>
>*random* 是生成随机数，有一定概率多个 *item* 会生成相同的值，不能保证唯一。
>
>如果是根据数据来生成 *item*，数据具有 *id* 属性，那么就可以使用 *id* 来作为 *key*。
>
>如果不是根据数据生成 *item*，那么最好的方式就是使用时间戳来作为 *key*。或者使用诸如 *uuid* 之类的库来生成唯一的 *id*。



### 46. **插槽与作用域插槽的区别是什么？**

>参考答案：
>
>插槽的作用是子组件提供了可替换模板，父组件可以更换模板的内容。
>
>作用域插槽给了子组件将数据返给父组件的能力，子组件一样可以复用，同时父组件也可以重新组织内容和样式。



### 47. ***vue* 中相同逻辑如何进行抽离？**

>参考答案：
>
>可以使用 *vue* 里面的混入（*mixin*）技术。混入（*mixin*）提供了一种非常灵活的方式，来将 *vue* 中相同的业务逻辑进行抽离。
>
>例如：
>
>- 在 *data* 中有很多是公用数据
>- 引用封装好的组件也都是一样的
>- *methods、watch、computed* 中也都有大量的重复代码
>
>当然这个时候可以将所有的代码重复去写来实现功能，但是我们并不不推荐使用这种方式，无论是工作量、工作效率和后期维护来说都是不建议的，这个时候 *mixin* 就可以大展身手了。
>
>一个混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被“混合”进入该组件本身的选项。说白了就是给每个生命周期，函数等等中间加入一些公共逻辑。
>
>**混入技术特点**
>
>- 当组件和混入对象含有同名选项时，这些选项将以恰当的方式进行“合并”。比如，数据对象在内部会进行递归合并，并在发生冲突时以组件数据优先。
>- 同名钩子函数将合并为一个数组，因此都将被调用。另外，混入对象的钩子将在组件自身钩子之前调用。
>- 值为对象的选项，例如 *methods、components* 和 *directives*，将被合并为同一个对象。两个对象键名冲突时，取组件对象的键值对。



### 48. **如何监听 *pushstate* 和 *replacestate* 的变化呢？**

>参考答案：
>
>*History.replaceState* 和 *pushState* 不会触发 *popstate* 事件，所以我们可以通过在方法中创建一个新的全局事件来实现  *pushstate* 和 *replacestate* 变化的监听。
>
>具体做法为：
>
>```js
>var _wr = function(type) {
>var orig = history[type];
>return function() {
>  var rv = orig.apply(this, arguments);
> var e = new Event(type);
>  e.arguments = arguments;
>  window.dispatchEvent(e);
>  return rv;
>};
>};
>history.pushState = _wr('pushState');
>history.replaceState = _wr('replaceState');
>```
>
>这样就创建了 *2* 个全新的事件，事件名为 *pushState* 和 *replaceState*，我们就可以在全局监听：
>
>```js
>window.addEventListener('replaceState', function(e) {
>console.log('THEY DID IT AGAIN! replaceState 111111');
>});
>window.addEventListener('pushState', function(e) {
>console.log('THEY DID IT AGAIN! pushState 2222222');
>});
>```
>
>这样就可以监听到 *pushState* 和 *replaceState* 行为。



### 49. **说一下 *vue3.0* 是如何变得更快的？**

>参考答案：
>
>**优化 *Diff* 算法**
>
>相比 *Vue 2*，*Vue 3* 采用了更加优化的渲染策略。去掉不必要的虚拟 *DOM* 树遍历和属性比较，因为这在更新期间往往会产生最大的性能开销。
>
>这里有三个主要的优化：
>
>- 首先，在 *DOM* 树级别。
>
> 在没有动态改变节点结构的模板指令（例如 *v-if* 和 *v-for*）的情况下，节点结构保持完全静态。
>
> 当更新节点时，不再需要递归遍历 *DOM* 树。所有的动态绑定部分将在一个平面数组中跟踪。这种优化通过将需要执行的树遍历量减少一个数量级来规避虚拟 *DOM* 的大部分开销。
>
>- 其次，编译器积极地检测模板中的静态节点、子树甚至数据对象，并在生成的代码中将它们提升到渲染函数之外。这样可以避免在每次渲染时重新创建这些对象，从而大大提高内存使用率并减少垃圾回收的频率。
>
>- 第三，在元素级别。
>
> 编译器还根据需要执行的更新类型，为每个具有动态绑定的元素生成一个优化标志。
>
> 例如，具有动态类绑定和许多静态属性的元素将收到一个标志，提示只需要进行类检查。运行时将获取这些提示并采用专用的快速路径。
>
>综合起来，这些技术大大改进了渲染更新基准，*Vue 3.0* 有时占用的 *CPU* 时间不到 *Vue 2* 的十分之一。
>
>**体积变小**
>
>重写后的 *Vue* 支持了 *tree-shaking*，像修剪树叶一样把不需要的东西给修剪掉，使 *Vue 3.0* 的体积更小。
>
>需要的模块才会打入到包里，优化后的 *Vue 3.0* 的打包体积只有原来的一半（*13kb*）。哪怕把所有的功能都引入进来也只有 *23kb*，依然比 *Vue 2.x* 更小。像 *keep-alive、transition* 甚至 *v-for* 等功能都可以按需引入。
>
>并且 *Vue 3.0* 优化了打包方法，使得打包后的 *bundle* 的体积也更小。
>
>官方所给出的一份惊艳的数据：打包大小减少 *41%*，初次渲染快 *55%*，更新快 *133%*，内存使用减少 *54%*。



### 50. 说一说自定义指令有哪些生命周期？

> 参考答案：
>
> 自定义指令的生命周期，有 5 个事件钩子，可以设置指令在某一个事件发生时的具体行为：
>
> - bind: 只调用一次，指令第一次绑定到元素时调用，用这个钩子函数可以定义一个在绑定时执行一次的初始化动作。
> - inserted: 被绑定元素插入父节点时调用（父节点存在即可调用，不必存在于 document 中）。
> - update: 被绑定元素所在的模板更新时调用，而不论绑定值是否变化。通过比较更新前后的绑定值，可以忽略不必要的模板更新（详细的钩子函数参数见下）。
> - componentUpdated: 被绑定元素所在模板完成一次更新周期时调用。
> - unbind: 只调用一次， 指令与元素解绑时调用。
>
> 钩子函数的参数 (包括 el，binding，vnode，oldVnode)
>
> - el: 指令所绑定的元素，可以用来直接操作 DOM 。
> - binding: 一个对象，包含以下属性：name: 指令名、value: 指令的绑定值、oldValue: 指令绑定的前一个值、expression: 绑定值的字符串形式、arg: 传给指令的参数、modifiers: 一个包含修饰符的对象。
> - vnode: Vue 编译生成的虚拟节点。
> - oldVnode: 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用。



### 51. 说一说相比 *vue3.x* 对比 *vue2.x* 变化

> 参考答案：
>
> 1. 源码组织方式变化：使用 TS 重写
> 2. 支持 Composition API：基于函数的API，更加灵活组织组件逻辑（vue2用的是options api）
> 3. 响应式系统提升：Vue3中响应式数据原理改成proxy，可监听动态新增删除属性，以及数组变化
> 4. 编译优化：vue2通过标记静态根节点优化diff，Vue3 标记和提升所有静态根节点，diff的时候只需要对比动态节点内容
> 5. 打包体积优化：移除了一些不常用的api（inline-template、filter）
> 6. 生命周期的变化：使用setup代替了之前的beforeCreate和created
> 7. Vue3 的 template 模板支持多个根标签
> 8. Vuex状态管理：创建实例的方式改变,Vue2为new Store , Vue3为createStore
> 9. Route 获取页面实例与路由信息：vue2通过this获取router实例，vue3通过使用 getCurrentInstance/ userRoute和userRouter方法获取当前组件实例
> 10. Props 的使用变化：vue2 通过 this 获取 props 里面的内容，vue3 直接通过 props
> 11. 父子组件传值：vue3 在向父组件传回数据时，如使用的自定义名称，如 backData，则需要在 emits 中定义一下



### 52. *vue* 为什么采用异步渲染

> 参考答案：
>
> 因为如果不采用异步更新，那么每次更新数据都会对当前组件进行重新渲染；所以为了性能考虑，*Vue* 会在本轮数据更新后，再去异步更新视图。
>
> 异步渲染的原理：
>
> 1. 调用 *notify( )* 方法，通知 *watcher* 进行更新操作
> 2. 依次调用 watcher 的 update 方法
> 3. 对 watcher 进行去重操作（通过id）放到队列里
> 4. 执行完后异步清空这个队列，nextTick（flushSchedulerQueue）进行批量更新操作



### 53. 组件中写 *name* 选项有哪些好处

> 参考答案：
>
> 1. 可以通过名字找到对应的组件（ 递归组件：组件自身调用自身 ）
> 2. 可以通过 *name* 属性实现缓存功能（*keep-alive*）
> 3. 可以通过 *name* 来识别组件（跨级组件通信时非常重要）
> 4. 使用 *vue-devtools* 调试工具里显示的组见名称是由 *vue* 中组件 *name* 决定的

