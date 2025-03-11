<template>
  <!-- <input type="text" v-focus /> -->
  <div>
    <!-- v-permission -->

    <!-- 必须具有read权限的用户才能看到此按钮 -->
    <button v-permission="['read']">查看</button>
    <!-- 必须具有write权限的用户才能看到此按钮 -->
    <button v-permission="['write']">编辑</button>
    <!-- 必须具有admin权限的用户才能看到此按钮 -->
    <button v-permission="['admin']">管理</button>

    <!-- v-time -->
    <div v-time="timeNow"></div>
    <div v-time="timeBefore"></div>
  </div>
</template>

<script setup>
// const vFocus = {
//   // 键值对
//   // 键：生命周期钩子 值：函数
//   mounted: (el) => {
//     // 这个是 DOM 原生方法，用来让元素获取焦点
//     el.focus()
//   }

import { ref } from 'vue'

// }
const timeNow = ref(new Date().getTime())
const timeBefore = ref(1488777695721)
</script>

<style scoped></style>
