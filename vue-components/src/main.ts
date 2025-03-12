import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { ObserveVisibility } from 'vue3-observe-visibility'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.directive('observe-visibility', ObserveVisibility)

app.mount('#app')
