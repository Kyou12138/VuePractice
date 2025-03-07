function reactive(obj) {
    return _deepProxy(obj);
}

function _deepProxy(obj) {
    let newObj = new Proxy(obj, {
        get(target, key, receiver) {
            let value = Reflect.get(target, key, receiver);
            console.log(`依赖收集，key=${key},value=${value}`);
            return value;
        },
        set(target, key, newValue, receiver) {
            console.log(`派发更新，key=${key},newValue=${newValue}`);
            return Reflect.set(target, key, newValue, receiver);
        },
    });
    for (key in obj) {
        if (typeof obj[key] === "object") {
            _deepProxy(obj[key]);
        }
    }

    return newObj;
}

function ref(obj) {
    Object.defineProperty(obj, {
        getters(){
            
        }
    })
}

const a = reactive({ a: 1 });

a.a = 2;
