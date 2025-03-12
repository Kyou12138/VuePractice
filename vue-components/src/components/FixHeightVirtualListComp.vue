<template>
    <div ref="container" class="virtual-list-container" @scroll="handleScroll">
        <!-- 该元素高度为总列表的高度，目的是为了形成滚动 -->
        <div class="virtual-list-phantom" :style="{ height: `${listHeight}px` }"></div>
        <!-- 该元素为可视区域，存放列表项 -->
        <div class="virtual-list-content" :style="{ transform: contentOffsetTransform }">
            <!-- v-for -->
            <div class="virtual-list-item" v-for="item in visibleItems" :key="item.id" :style="{
                height: `${itemHeight}px`,
                lineHeight: `${itemHeight}px`
            }">
                {{ item.value }}
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import type { ListItem } from '@/types/ListItem';
import { computed, onMounted, ref } from 'vue';

const { listData = [], itemHeight = 150 } = defineProps<{ listData: ListItem[], itemHeight: number }>()

//开始索引
const startIndex = ref(0);
//结束索引
const endIndex = ref(0);
//初始偏移量
const contentOffset = ref(0)

//列表总高度
const listHeight = computed(() => listData.length * itemHeight);
//可视区域高度
const screenHeight = ref(0)
const container = ref<HTMLElement>(); //可视区域dom元素
//可显示的列表项数
const visibleCount = computed(() => Math.ceil(screenHeight.value / itemHeight))
//显示的列表项
const visibleItems = computed(() => listData.slice(startIndex.value, Math.min(endIndex.value, listData.length + 1))) //考虑结尾边界
//content需要同步往下transform的高度
const contentOffsetTransform = computed(() => `translate3d(0, ${contentOffset.value}px, 0)`)

//滚动触发计算更新
const handleScroll = () => {
    const scrollTop = container.value!.scrollTop;
    startIndex.value = Math.floor(scrollTop / itemHeight);
    endIndex.value = startIndex.value + visibleCount.value;
    contentOffset.value = scrollTop - scrollTop % itemHeight;
}

onMounted(() => {
    screenHeight.value = container.value!.clientHeight
    endIndex.value = visibleCount.value;
})


</script>

<style scoped>
.virtual-list-container {
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
}

.virtual-list-phantom {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    z-index: -1;
}

.virtual-list-content {
    left: 0;
    top: 0;
    right: 0;
    position: absolute;
    text-align: center;
}

.virtual-list-item {
    padding: 10px;
    color: #555;
    box-sizing: border-box;
    border-bottom: 1px solid #999;
}
</style>