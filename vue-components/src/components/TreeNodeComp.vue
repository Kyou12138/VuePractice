<template>
  <div class="tree-node" v-for="(node, index) in data" :key="node.label">
    <div class="node-label">
      <button class="toggle-button" @click="isOpenArr[index] = !isOpenArr[index]" v-if="hasChildren(node)">
        {{ isOpenArr[index] ? "▼" : "▶" }}
      </button>
      <input :id="node.label" type="checkbox" v-if="showCheckbox" v-model="node.checked"
        @change="handleCheckboxChange(node)" />
      <label :for="node.label">{{ node.label }}</label>
    </div>
    <div v-if="transition">
      <Transition name="expand" @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter"
        @before-leave="beforeLeave" @leave="leave" @after-leave="afterLeave">
        <div v-show="isOpenArr[index]" v-if="hasChildren(node)">
          <TreeNodeComp :data="node.children || []" :show-checkbox="showCheckbox" :transition="transition"
            @update:child-check="$emit('update:child-check', node)" />
        </div>
      </Transition>
    </div>
    <div v-else>
      <div v-show="isOpenArr[index]" v-if="hasChildren(node)">
        <TreeNodeComp :data="node.children || []" :show-checkbox="showCheckbox" :transition="transition"
          @update:child-check="$emit('update:child-check', node)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, inject } from 'vue';
import type { TreeNode } from '@/types/TreeNode';

const { data, showCheckbox = true, transition = true } = defineProps<{ data: TreeNode[], showCheckbox: boolean, transition: boolean }>()

//向下级提供父节点，以便更新时也能修改父节点的check状态
const parentNode = inject<TreeNode[]>('parentNode', []) //拿父节点
provide('parentNode', data) //提供父节点

const emits = defineEmits(['update:child-check'])

//控制是否展开
const isOpenArr = ref(data.map(() => false))
function hasChildren(node: TreeNode): boolean {
  return node.children !== undefined && node.children.length > 0;
}

//处理复选框
function handleCheckboxChange(node: TreeNode) {

  const updateChildrenCheck = (node: TreeNode, checked: boolean) => {
    node.children && node.children.forEach(m => {
      m.checked = checked;
      updateChildrenCheck(m, checked)
    })
  }

  //1.更新子节点
  updateChildrenCheck(node, node.checked)

  const hasChildren = (node: TreeNode, childNode: TreeNode) => {
    if (node.children) {
      let queue = [...node.children]
      while (queue.length > 0) {
        const len = queue.length;
        for (let i = 0; i < len; i++) {
          const curNode = queue.shift();
          if (curNode === childNode) {
            return true;
          }
          if (curNode?.children) {
            queue.push(...curNode.children)
          }
        }
      }
    }
    return false;
  }

  const updateParentCheck = (node: TreeNode) => {
    if (parentNode) {
      for (const pNode of parentNode) {
        if (pNode.children && hasChildren(pNode, node)) {
          const allChildrenChecked = pNode.children.every(m => m.checked);
          if (pNode.checked !== allChildrenChecked) {
            pNode.checked = allChildrenChecked;
            updateParentCheck(pNode)
          }
        }
      }
    }
  }

  //2.更新父节点
  updateParentCheck(node);

  //触发自定义事件
  emits('update:child-check', node)
}

//expand过渡动画
function beforeEnter(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.maxHeight = '0'
    el.style.opacity = '0'
    el.style.overflow = 'hidden'
  }
}
function enter(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.transition = 'max-height 0.3s ease, opacity 0.3s ease'
    el.style.maxHeight = el.scrollHeight + 'px'
    el.style.opacity = '1'
  }
}

function afterEnter(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.maxHeight = 'none'
  }
}

function beforeLeave(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.maxHeight = el.scrollHeight + 'px'
    el.style.opacity = '1'
    el.style.overflow = 'hidden'
  }
}

function leave(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.transition = 'max-height 0.3s ease, opacity 0.3s ease'
    el.style.maxHeight = '0'
    el.style.opacity = '0'
  }
}

function afterLeave(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.maxHeight = 'none'
  }
}


</script>

<style scoped>
.tree-node {
  margin-left: 20px;
  font-family: Arial, Helvetica, sans-serif;
}

.node-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  color: black;
}
</style>