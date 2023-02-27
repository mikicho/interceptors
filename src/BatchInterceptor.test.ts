import { vi, it, expect, afterEach } from 'vitest'
import { Interceptor } from './Interceptor'
import { BatchInterceptor } from './BatchInterceptor'

afterEach(() => {
  vi.resetAllMocks()
})

it('applies child interceptors', () => {
  class PrimaryInterceptor extends Interceptor<any> {
    constructor() {
      super(Symbol('primary'))
    }
  }

  class SecondaryInterceptor extends Interceptor<any> {
    constructor() {
      super(Symbol('secondary'))
    }
  }

  const instances = {
    primary: new PrimaryInterceptor(),
    secondary: new SecondaryInterceptor(),
  }

  const interceptor = new BatchInterceptor({
    name: 'batch-apply',
    interceptors: [instances.primary, instances.secondary],
  })

  const primaryApplySpy = vi.spyOn(instances.primary, 'apply')
  const secondaryApplySpy = vi.spyOn(instances.secondary, 'apply')

  interceptor.apply()

  expect(primaryApplySpy).toHaveBeenCalledTimes(1)
  expect(secondaryApplySpy).toHaveBeenCalledTimes(1)
})

it('proxies event listeners to the interceptors', () => {
  class PrimaryInterceptor extends Interceptor<{ hello: [string] }> {
    constructor() {
      super(Symbol('primary'))
    }
  }

  class SecondaryInterceptor extends Interceptor<{
    goodbye: [string]
  }> {
    constructor() {
      super(Symbol('secondary'))
    }
  }

  const instances = {
    primary: new PrimaryInterceptor(),
    secondary: new SecondaryInterceptor(),
  }

  const interceptor = new BatchInterceptor({
    name: 'batch-proxy',
    interceptors: [instances.primary, instances.secondary],
  })

  const helloListener = vi.fn()
  interceptor.on('hello', helloListener)

  const goodbyeListener = vi.fn()
  interceptor.on('goodbye', goodbyeListener)

  // Emulate the child interceptor emitting events.
  instances.primary['emitter'].emit('hello', 'John')
  instances.secondary['emitter'].emit('goodbye', 'Kate')

  // Must call the batch interceptor listener.
  expect(helloListener).toHaveBeenCalledTimes(1)
  expect(helloListener).toHaveBeenCalledWith('John')
  expect(goodbyeListener).toHaveBeenCalledTimes(1)
  expect(goodbyeListener).toHaveBeenCalledWith('Kate')
})

it('disposes of child interceptors', async () => {
  class PrimaryInterceptor extends Interceptor<any> {
    constructor() {
      super(Symbol('primary'))
    }
  }

  class SecondaryInterceptor extends Interceptor<any> {
    constructor() {
      super(Symbol('secondary'))
    }
  }

  const instances = {
    primary: new PrimaryInterceptor(),
    secondary: new SecondaryInterceptor(),
  }

  const interceptor = new BatchInterceptor({
    name: 'batch-dispose',
    interceptors: [instances.primary, instances.secondary],
  })

  const primaryDisposeSpy = vi.spyOn(instances.primary, 'dispose')
  const secondaryDisposeSpy = vi.spyOn(instances.secondary, 'dispose')

  interceptor.apply()
  interceptor.dispose()

  expect(primaryDisposeSpy).toHaveBeenCalledTimes(1)
  expect(secondaryDisposeSpy).toHaveBeenCalledTimes(1)
})
