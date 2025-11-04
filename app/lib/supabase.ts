/**
 * QualifyFirst - Supabase Client Configuration
 *
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const missingConfigMessage =
  'Supabase client is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'

const createStubFunction = () =>
  new Proxy(
    () => {
      throw new Error(missingConfigMessage)
    },
    {
      apply() {
        throw new Error(missingConfigMessage)
      },
      get() {
        return createStubFunction()
      },
    },
  )

const createStubClient = (): SupabaseClient =>
  new Proxy(
    {},
    {
      get() {
        return createStubFunction()
      },
    },
  ) as SupabaseClient

const createSupabaseClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(missingConfigMessage)
    }
    return createStubClient()
  }

  return createBrowserClient(url, anonKey)
}

export const supabase = createSupabaseClient()
