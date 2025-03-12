<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/treeNode">树形组件</RouterLink>
        <RouterLink to="/debounceTest">自定义Ref防抖</RouterLink>
        <RouterLink to="/lazyLoadTest">懒加载</RouterLink>
        <RouterLink to="/virtualListTest">虚拟列表组件</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
nav a {
  margin-right: 10px;
}

html {
  height: 100%;
}

body {
  height: 100%;
  margin: 0;
}
</style>
