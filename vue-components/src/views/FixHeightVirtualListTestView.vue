<template>
    <div id="app">
        <VirtualListComp :listData="data" :itemHeight="100" />
    </div>
</template>

<script setup lang="ts">
import VirtualListComp from '@/components/FixHeightVirtualListComp.vue'
import type { ListItem } from '@/types/ListItem';
import { ref, type Ref } from 'vue'


//创建长列表数据
let longData = []
for (let i = 0; i < 10000; i++) {
    longData.push({ id: i + 1, value: `第${i + 1}条数据` })
}

const data: Ref<ListItem[]> = ref(longData);

</script>

<style scoped>
#app {
    height: calc(100vh - 37px);
}
</style>