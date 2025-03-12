import { customRef } from 'vue'
import { debounce } from 'lodash'
export function debounceRef(value: any, delay = 1000) {
  return customRef((track, trigger) => {
    let _value = value

    const _debounce = debounce((val) => {
      _value = val
      trigger()
    }, delay)

    return {
      get() {
        track()
        return _value
      },
      set(val) {
        _debounce(val)
      },
    }
  })
}
