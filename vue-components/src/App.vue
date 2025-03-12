<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/treeNode">TreeNode</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
nav a {
  margin-right: 10px;
}
</style>
