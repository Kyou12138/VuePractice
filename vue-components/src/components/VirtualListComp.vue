<template>
    <div ref="containerRef" class="virtual-list-container">
        <!-- 该元素高度为总列表的高度，目的是为了形成滚动 -->
        <div ref="phanTomRef" class="virtual-list-phantom"></div>
        <!-- 该元素为可视区域，存放列表项 -->
        <div ref="contentRef" class="virtual-list-content">
            <!-- v-for -->
            <div ref="itemsRef" class="virtual-list-item" v-for="item in visibleItems" :key="item.id">
                {{ item.value }}
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import type { ListItem, ListItemPosition } from '@/types/ListItem';
import { computed, nextTick, onMounted, onUpdated, ref, watch } from 'vue';

const { listData = [], estimatedItemHeight = 40, bufferScale = 1 } =
    defineProps<{ listData: ListItem[], estimatedItemHeight: number, bufferScale: number }>()

//缓存列表，用于存储列表项的位置信息
let positions: ListItemPosition[] = []
//用于初始化每个列表项的位置信息
const initPositions = () => {
    positions = listData.map((_, index) => ({
        index, //下标
        height: estimatedItemHeight, //采用预估的高度
        top: index * estimatedItemHeight, //列表项的顶部位置
        bottom: (index + 1) * estimatedItemHeight //列表项的底部位置
    }))
}

//开始索引
const startIndex = ref(0);
//结束索引
const endIndex = ref(0);
//初始偏移量
// const contentOffset = ref(0)

//引用容器元素
const containerRef = ref<HTMLElement>(); //可视区域dom元素
//引用phantom元素
const phanTomRef = ref<HTMLElement>()
//引用content元素
const contentRef = ref<HTMLElement>();
//引用列表项元素
const itemsRef = ref<HTMLElement[]>();

//可视区域高度
const screenHeight = ref(0)
//可显示的列表项数
// const visibleCount = computed(() => Math.ceil(screenHeight.value / itemHeight))
//显示的列表项
const visibleItems = computed(() => {
    //要加入缓冲区
    let i = startIndex.value - aboveBufferCount.value > 0 ? startIndex.value - aboveBufferCount.value : 0;
    return listData.slice(i, Math.min(endIndex.value + belowBufferCount.value, listData.length + 1));

}) //考虑结尾边界

const observer = ref<IntersectionObserver>();
//intersectionObserver监听触发计算
const createObserver = () => {
    observer.value = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                handleScroll();
            }
        })
    }, {
        root: containerRef.value, //观察的容器
        rootMargin: '0px',
        threshold: 0.1
    })
}

//观察列表项
const observerItems = () => {
    itemsRef.value?.forEach(itemRef => {
        observer.value?.observe(itemRef);
    })
}

//intersection触发计算更新
const handleScroll = () => {
    const scrollTop = containerRef.value!.scrollTop;
    // startIndex.value = Math.floor(scrollTop / itemHeight);
    startIndex.value = binarySearchIndex(scrollTop)
    // endIndex.value = startIndex.value + visibleCount.value;
    endIndex.value = binarySearchIndex(scrollTop + screenHeight.value);
    // contentOffset.value = scrollTop - scrollTop % itemHeight;
    setContentOffset()
}

onMounted(() => {
    screenHeight.value = containerRef.value!.clientHeight
    // endIndex.value = visibleCount.value;
    //初始化预估的列表项缓存位置信息
    initPositions();
    endIndex.value = binarySearchIndex(screenHeight.value);
    createObserver();
})

onUpdated(() => {
    //使用nextTick确保dom更新完毕后【获取列表项位置信息】
    nextTick(() => {
        if (!itemsRef.value || !itemsRef.value.length) return;
        //1.将预估的缓存位置信息更新为实际的positions
        updatePositions();
        //2.更新虚拟列表高度listHeight
        phanTomRef!.value!.style.height = positions[positions.length - 1].bottom + 'px'
        //3.更新列表内容的偏移量
        setContentOffset();
        //观察列表项
        observerItems();
    })
})

//监听数据变化，并重新初始化缓存位置信息
watch(() => listData, initPositions);

const aboveBufferCount = computed(() => Math.min(startIndex.value, bufferScale * (endIndex.value - startIndex.value)))
const belowBufferCount = computed(() => Math.min(listData.length - endIndex.value, bufferScale * (endIndex.value - startIndex.value)))

function updatePositions() {
    itemsRef.value?.forEach((node, index) => {
        //获取列表项实际高度
        const height = node.getBoundingClientRect().height;
        //计算预估高度和实际高度的差值 
        const oldHeight = positions[index].height; //预估高度
        const diffValue = oldHeight - height; //差值
        if (diffValue) {
            //存在差值需更新缓存
            positions[index].bottom -= diffValue;
            positions[index].height = height;
            //更新后续所有列表项的位置
            for (let i = index + 1; i < positions.length; i++) {
                positions[i].top = positions[i - 1].bottom;
                positions[i].bottom -= diffValue;
            }
        }


    })
}

function setContentOffset() {
    // let offset = startIndex.value - 1 >= 0 ? positions[startIndex.value - 1].bottom : 0;
    // contentRef.value!.style.transform = `translate3d(0, ${offset}px, 0)`
    let offset;
    if (startIndex.value >= 1) {
        //不是第一个列表项，需计算offset
        let diffValue = positions[startIndex.value].top -
            (positions[startIndex.value - aboveBufferCount.value] ?
                positions[startIndex.value - aboveBufferCount.value].top : 0);
        offset = positions[startIndex.value - 1].bottom - diffValue;
    } else {
        offset = 0;
    }
    contentRef.value!.style.transform = `translate3d(0, ${offset}px, 0)`
}

//找到第一个bottom大于scrollTop的position下标
function binarySearchIndex(height: number) {
    let i = 0;
    let j = positions.length;
    while (i < j) {
        let mid = i + Math.floor((j - i) / 2);
        if (height > positions[mid].bottom) {
            i = mid + 1;
        } else if (height < positions[mid].bottom) {
            j = mid;
        }
    }
    return i;
}
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