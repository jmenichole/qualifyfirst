/**
 * Magic Provider Utilities
 * ------------------------
 * Shared helper functions for working with the Magic Admin API
 * when registering identity providers for QualifyFirst and the
 * companion apps (JustTheTip & TiltCheck).
 */

export const MAGIC_PROVIDER_ENDPOINT =
  'https://tee.express.magiclabs.com/v1/identity/provider'

export const MAGIC_WALLET_ENDPOINT = 'https://tee.express.magiclabs.com/v1/wallet'

export type MagicProviderPayload = {
  issuer?: string
  audience?: string
  jwks_uri?: string
}

export type NamedMagicProviderPayload = MagicProviderPayload & {
  /**
   * Friendly identifier so the dashboard can tell which app
   * a provider registration response belongs to.
   */
  name?: string
}

export type MagicProviderBatchRequest = {
  /**
   * Optional shared audience value so multiple providers can
   * authenticate the exact same user pool.
   */
  shared_audience?: string
  providers: NamedMagicProviderPayload[]
}

export const REQUIRED_FIELDS: (keyof Required<MagicProviderPayload>)[] = [
  'issuer',
  'audience',
  'jwks_uri',
]

/**
 * Trim and coerce provider payload values into strings.
 */
export const sanitizeProviderPayload = (
  payload: MagicProviderPayload,
  sharedAudience?: string,
): MagicProviderPayload => ({
  issuer: typeof payload.issuer === 'string' ? payload.issuer.trim() : '',
  audience:
    typeof payload.audience === 'string'
      ? payload.audience.trim()
      : typeof sharedAudience === 'string'
        ? sharedAudience.trim()
        : '',
  jwks_uri: typeof payload.jwks_uri === 'string' ? payload.jwks_uri.trim() : '',
})

export const findMissingFields = (payload: MagicProviderPayload) =>
  REQUIRED_FIELDS.filter((field) => !payload[field])

export type MagicProviderSuccess = {
  success: true
  provider: unknown
  name?: string
}

export type MagicProviderFailure = {
  success: false
  status: number
  error: string
  details?: unknown
  name?: string
}

export type MagicProviderResult = MagicProviderSuccess | MagicProviderFailure

export async function registerMagicProvider(
  secretKey: string,
  payload: MagicProviderPayload,
  name?: string,
): Promise<MagicProviderResult> {
  try {
    const response = await fetch(MAGIC_PROVIDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Magic-Secret-Key': secretKey,
      },
      body: JSON.stringify(payload),
    })

    const responseBody = await response
      .json()
      .catch(() => ({ message: 'Magic API did not return JSON content.' }))

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: 'Magic API request failed.',
        details: responseBody,
        name,
      }
    }

    return {
      success: true,
      provider: responseBody,
      name,
    }
  } catch (error) {
    console.error('Magic provider registration failed:', error)
    return {
      success: false,
      status: 502,
      error:
        'Unable to register Magic provider. Verify network connectivity and credentials.',
      name,
    }
  }
}

export async function registerMagicProvidersBatch(
  secretKey: string,
  providers: NamedMagicProviderPayload[],
  sharedAudience?: string,
) {
  const sanitizedProviders = providers.map((provider) => ({
    name: provider.name,
    payload: sanitizeProviderPayload(provider, sharedAudience),
  }))

  const validationErrors = sanitizedProviders
    .map(({ name, payload }) => ({ name, missing: findMissingFields(payload) }))
    .filter(({ missing }) => missing.length > 0)

  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Missing required fields for one or more providers.',
      details: validationErrors.map(({ name, missing }) => ({
        name,
        missing,
      })),
    }
  }

  const results = await Promise.all(
    sanitizedProviders.map(({ name, payload }) =>
      registerMagicProvider(secretKey, payload, name),
    ),
  )

  const failed = results.filter((result) => !result.success)

  if (failed.length > 0) {
    return {
      success: false,
      error: 'One or more providers failed to register with Magic.',
      results,
    }
  }

  return {
    success: true,
    results,
  }
}

export type MagicWalletRequest = {
  /**
   * Provider identifier returned by the Magic Admin API when the OIDC
   * provider was created (see registerMagicProvider).
   */
  providerId: string
  /**
   * JWT minted by your auth provider (e.g., Supabase). Magic requires
   * this token in the Authorization header when creating a wallet.
   */
  userJwt: string
  /**
   * Which chain to mint a wallet for. Defaults to SOL to match the
   * original implementation request.
   */
  chain?: string
}

export type MagicWalletSuccess = {
  success: true
  publicAddress: string
}

export type MagicWalletFailure = {
  success: false
  status: number
  error: string
  details?: unknown
}

export type MagicWalletResult = MagicWalletSuccess | MagicWalletFailure

export async function createMagicWallet(
  secretKey: string,
  { providerId, userJwt, chain = 'SOL' }: MagicWalletRequest,
): Promise<MagicWalletResult> {
  try {
    const response = await fetch(MAGIC_WALLET_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwt}`,
        'X-Magic-Secret-Key': secretKey,
        'X-OIDC-Provider-ID': providerId,
        'X-Magic-Chain': chain,
      },
    })

    const responseBody = await response
      .json()
      .catch(() => ({ message: 'Magic API did not return JSON content.' }))

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: 'Magic wallet request failed.',
        details: responseBody,
      }
    }

    const publicAddress = (responseBody as { public_address?: string }).public_address

    if (!publicAddress) {
      return {
        success: false,
        status: 502,
        error: 'Magic wallet response missing public address.',
        details: responseBody,
      }
    }

    return {
      success: true,
      publicAddress,
    }
  } catch (error) {
    console.error('Magic wallet creation failed:', error)
    return {
      success: false,
      status: 502,
      error:
        'Unable to create Magic wallet. Verify network connectivity, provider ID, and credentials.',
    }
  }
}
