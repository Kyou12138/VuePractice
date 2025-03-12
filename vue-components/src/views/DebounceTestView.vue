<template>
    <div class="container">
        <input type="text" v-model="text" />
        <p class="result">{{ text }}</p>
    </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue'
// const text = ref('')
import { debounceRef } from '@/utils/debounceRef'
const text = debounceRef('', 500)

</script>

<style scoped>
.container {
    width: 80%;
    margin: 1em auto;
}

.result {
    color: #333
}

.container input {
    width: 100%;
    height: 30px;
}
</style>