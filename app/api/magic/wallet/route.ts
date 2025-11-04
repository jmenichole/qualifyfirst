/**
 * QualifyFirst - Magic Wallet Creation Route
 *
 * Creates (or fetches) a blockchain wallet for a user via the Magic Admin API.
 * Requires the OIDC provider ID from the provider registration step and the
 * JWT issued by your auth provider (e.g., Supabase) for the current user.
 */

import { NextResponse } from 'next/server'

import {
  createMagicWallet,
  type MagicWalletRequest,
} from '../../../lib/magic/provider'

const invalidBodyResponse = () =>
  NextResponse.json(
    {
      error:
        'Invalid payload. Provide provider_id, user_jwt, and optionally chain.',
    },
    { status: 400 },
  )

const REQUIRED_FIELDS: (keyof MagicWalletRequest)[] = ['providerId', 'userJwt']

export async function POST(request: Request) {
  const secretKey = process.env.MAGIC_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          'Magic secret key is not configured. Set MAGIC_SECRET_KEY in your environment.',
      },
      { status: 500 },
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return invalidBodyResponse()
  }

  const {
    provider_id: providerIdRaw,
    user_jwt: userJwtRaw,
    chain: chainRaw,
  } = body as Record<string, unknown>

  const payload: MagicWalletRequest = {
    providerId: typeof providerIdRaw === 'string' ? providerIdRaw.trim() : '',
    userJwt: typeof userJwtRaw === 'string' ? userJwtRaw.trim() : '',
    chain: typeof chainRaw === 'string' ? chainRaw.trim() : undefined,
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field])

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`,
      },
      { status: 400 },
    )
  }

  const result = await createMagicWallet(secretKey, payload)

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details,
      },
      { status: result.status },
    )
  }

  return NextResponse.json({ success: true, public_address: result.publicAddress })
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        'POST provider_id and user_jwt to mint or fetch a Magic wallet. Optionally override chain (default: SOL).',
      required_fields: ['provider_id', 'user_jwt'],
      example: {
        provider_id: 'magic_provider_id_from_registration',
        user_jwt: 'jwt_from_your_auth_provider',
        chain: 'SOL',
      },
    },
    { status: 200 },
  )
}
