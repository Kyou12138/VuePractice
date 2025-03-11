// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import permission from './directives/VPermission'
import time from '@/directives/VTime'

const app = createApp(App)

// app.directive('focus', {
//   mounted(el) {
//     el.focus()
//   }
// })
//全局注册
app.directive('permission', permission)
app.directive('time', time)

app.mount('#app')
