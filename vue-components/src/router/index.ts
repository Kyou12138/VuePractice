import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TreeNodeView from '@/views/TreeNodeView.vue'
import DebounceTestView from '@/views/DebounceTestView.vue'
import LazyLoadTestView from '@/views/LazyLoadTestView.vue'
import FixHeightVirtualListTestView from '@/views/FixHeightVirtualListTestView.vue'
import VirtualListTestView from '@/views/VirtualListTestView.vue'

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
    {
      path: '/debounceTest',
      name: 'debounceTest',
      component: DebounceTestView,
    },
    {
      path: '/lazyLoadTest',
      name: 'lazyLoadTest',
      component: LazyLoadTestView,
    },
    {
      path: '/fixHeightVirtualListTest',
      name: 'fixHeightVirtualListTest',
      component: FixHeightVirtualListTestView,
    },
    {
      path: '/virtualListTest',
      name: 'virtualListTest',
      component: VirtualListTestView,
    },
  ],
})

export default router
