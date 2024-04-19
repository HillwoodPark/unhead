import { ScriptNetworkEvents, hashCode } from '@unhead/shared'
import type {
  DomRenderTagContext,
  Head,
  ScriptInstance,
  UseScriptInput,
  UseScriptOptions,
  UseScriptResolvedInput,
} from '@unhead/schema'
import { getActiveHead } from './useActiveHead'

/**
 * Load third-party scripts with SSR support and a proxied API.
 *
 * @experimental
 * @see https://unhead.unjs.io/usage/composables/use-script
 */
export function useScript<T>(_input: UseScriptInput, _options?: UseScriptOptions<T>): T & { $script: ScriptInstance<T> } {
  const input: UseScriptResolvedInput = typeof _input === 'string' ? { src: _input } : _input
  const options = _options || {}
  const head = options.head || getActiveHead()
  if (!head)
    throw new Error('Missing Unhead context.')

  const isAbsolute = input.src && (input.src.startsWith('http') || input.src.startsWith('//'))
  const id = input.key || hashCode(input.src || (typeof input.innerHTML === 'string' ? input.innerHTML : ''))
  const key = `use-script.${id}`
  if (head._scripts?.[id])
    return head._scripts[id]
  options.beforeInit?.()
  const syncStatus = (s: ScriptInstance<T>['status']) => {
    script.status = s
    head.hooks.callHook(`script:updated`, hookCtx)
  }
  const trigger = typeof options.trigger !== 'undefined' ? options.trigger : 'client'
  ScriptNetworkEvents
    .forEach((fn) => {
      const _fn = typeof input[fn] === 'function' ? input[fn].bind(options.eventContext) : null
      input[fn] = (e: Event) => {
        syncStatus(fn === 'onload' ? 'loaded' : fn === 'onerror' ? 'error' : 'loading')
        _fn?.(e)
      }
    })
  const loadPromise = new Promise<T>((resolve, reject) => {
    const cleanUp = head.hooks.hook('script:updated', ({ script }: { script: ScriptInstance<T> }) => {
      if (script.id === id && (script.status === 'loaded' || script.status === 'error')) {
        if (script.status === 'loaded') {
          const api = options.use?.()
          api && resolve(api)
        }
        else if (script.status === 'error') {
          reject(new Error(`Failed to load script: ${input.src}`))
        cleanUp()
      }
    })
  })
  const script = {
    id,
    status: 'awaitingLoad',
    loaded: false,
    remove() {
      if (script.entry) {
        script.entry.dispose()
        syncStatus('removed')
        delete head._scripts?.[id]
        return true
      }
      return false
    },
    load() {
      if (!script.entry) {
        options.beforeInit?.()
        syncStatus('loading')
        const defaults: Required<Head>['script'][0] = {
          defer: true,
          fetchpriority: 'low',
        }
        if (isAbsolute) {
          defaults.crossorigin = 'anonymous'
          defaults.referrerpolicy = 'no-referrer'
        }
        // status should get updated from script events
        script.entry = head.push({
          script: [{ ...defaults, ...input, key }],
        }, options)
      }
      return loadPromise
    },
  } as any as ScriptInstance<T>

  const hookCtx = { script }

  if ((trigger === 'client' && !head.ssr) || (trigger === 'server' && head.ssr))
    script.load()
  else if (trigger instanceof Promise)
    trigger.then(script.load)
  else if (typeof trigger === 'function')
    trigger(script.load)

  // 3. Proxy the script API
  const instance = new Proxy({}, {
    get(_, fn) {
      const $script = Object.assign(loadPromise, script)
      const stub = options.stub?.({ script: $script, fn })
      if (stub)
        return stub
      // $script is stubbed by abstraction layers
      if (fn === '$script')
        return $script
      const attempt = (args?: any[]) => {
        if (head.ssr)
          return
        const api = options.use?.()
        const exists = !!(api && fn in api)
        const hookCtx = { script, fn, args, exists }
        // we can't await this, mainly used for debugging
        head.hooks.callHook('script:instance-fn', hookCtx)
        return exists && api[fn]
      }
      // api may already be loaded
      // for instance GTM will already have dataLayer available, we can expose it directly
      return attempt() || ((...args: any[]) => loadPromise.then(() => attempt(args)(...args)))
    },
  }) as any as T & { $script: ScriptInstance<T> }
  // 4. Providing a unique context for the script
  head._scripts = Object.assign(
    head._scripts || {},
    { [id]: instance },
  )
  return instance
}
