import { EventEmitter } from 'events'

const globalKey = '__sseEmitter__'
const emitter = globalThis[globalKey] || new EventEmitter()
globalThis[globalKey] = emitter

export function subscribe(handler) {
  emitter.on('message', handler)
  return () => emitter.off('message', handler)
}

export function publish(payload) {
  try {
    emitter.emit('message', payload)
  } catch {}
}
