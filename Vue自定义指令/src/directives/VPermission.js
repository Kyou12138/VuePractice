import { userPermission } from '@/mock'
export default {
  mounted(el, binding, vnode) {
    const { value } = binding
    if (value && value instanceof Array) {
      const hasPermission = value.some((m) => userPermission.includes(m))
      if (!hasPermission) {
        el.style.display = 'none'
      }
    } else {
      console.warn('使用v-permission指令时，请传入数组参数')
    }
  }
}
