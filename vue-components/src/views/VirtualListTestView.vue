<template>
    <div id="app">
        <VirtualListComp :listData="data" :bufferScale="1" :estimatedItemHeight="100" />
    </div>
</template>

<script setup lang="ts">
import VirtualListComp from '@/components/VirtualListComp.vue'
import type { ListItem } from '@/types/ListItem';
import { faker } from '@faker-js/faker';
import { ref, type Ref } from 'vue'


//创建长列表数据
let longData = []
for (let i = 0; i < 10000; i++) {
    longData.push({ id: i + 1, value: faker.lorem.sentences() })
}

const data: Ref<ListItem[]> = ref(longData);

</script>

<style scoped>
#app {
    height: calc(100vh - 37px);
}
</style>