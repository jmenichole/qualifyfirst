'use client';

/**
 * Lightweight Magic SDK loader
 * Loads the Magic Web SDK from the CDN so we avoid bundling the package and
 * keep compatibility with environments that block `npm install` during CI.
 */

type MagicLoginOptions = {
  email: string
  showUI?: boolean
  redirectURI?: string
}

type MagicAuthModule = {
  loginWithMagicLink(options: MagicLoginOptions): Promise<unknown>
  loginWithCredential(credential: string): Promise<string>
}

type MagicUserModule = {
  getIdToken(): Promise<string | null>
  isLoggedIn(): Promise<boolean>
  logout(): Promise<void>
}

type MagicClient = {
  auth: MagicAuthModule
  user: MagicUserModule
}

type MagicConstructor = new (
  key: string,
  config?: {
    testMode?: boolean
  },
) => MagicClient

declare global {
  interface Window {
    Magic?: MagicConstructor
  }
}

const MAGIC_CDN_URL =
  'https://cdn.jsdelivr.net/npm/magic-sdk@latest/dist/magic-sdk.umd.min.js'

let magicInstance: MagicClient | null = null
let loaderPromise: Promise<MagicClient | null> | null = null

const loadMagicScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Magic SDK can only be loaded in the browser.'))
      return
    }

    if (window.Magic) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-magic-sdk="true"]',
    )

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve()
        return
      }

      const onLoad = () => {
        existingScript.dataset.loaded = 'true'
        existingScript.removeEventListener('load', onLoad)
        existingScript.removeEventListener('error', onError)
        resolve()
      }

      const onError = () => {
        existingScript.removeEventListener('load', onLoad)
        existingScript.removeEventListener('error', onError)
        reject(new Error('Failed to load Magic SDK.'))
      }

      existingScript.addEventListener('load', onLoad)
      existingScript.addEventListener('error', onError)
      return
    }

    const script = document.createElement('script')
    script.src = MAGIC_CDN_URL
    script.async = true
    script.dataset.magicSdk = 'true'

    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Magic SDK.'))

    document.head.appendChild(script)
  })

const createMagicInstance = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const publishableKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY

  if (!publishableKey) {
    console.error(
      'NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not configured. Magic login cannot be initialised.',
    )
    return null
  }

  const MagicCtor = window.Magic

  if (!MagicCtor) {
    console.error('Magic SDK constructor is unavailable in the browser.')
    return null
  }

  const config: { testMode?: boolean } = {}

  if (process.env.NEXT_PUBLIC_MAGIC_TEST_MODE === 'true') {
    config.testMode = true
  }

  magicInstance = new MagicCtor(publishableKey, config)
  return magicInstance
}

export const getMagicClient = async (): Promise<MagicClient | null> => {
  if (magicInstance) {
    return magicInstance
  }

  if (!loaderPromise) {
    loaderPromise = (async () => {
      try {
        await loadMagicScript()
      } catch (error) {
        console.error(error)
        return null
      }

      return createMagicInstance()
    })()
  }

  const instance = await loaderPromise

  if (!instance) {
    loaderPromise = null
  }

  return instance
}

export const resetMagicClient = () => {
  magicInstance = null
  loaderPromise = null
}

export type { MagicClient }
