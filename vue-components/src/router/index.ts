import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TreeNodeView from '@/views/TreeNodeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/treeNode',
      name: 'treeNode',
      component: TreeNodeView,
    },
  ],
})

export default router
