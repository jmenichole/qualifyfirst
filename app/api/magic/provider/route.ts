/**
 * QualifyFirst - Magic Identity Provider Registration Route
 *
 * Supports registering one or many providers (QualifyFirst,
 * JustTheTip, TiltCheck, etc.) against the same Magic project so
 * every app can authenticate the exact same user accounts.
 */

import { NextResponse } from 'next/server'

import {
  REQUIRED_FIELDS,
  type MagicProviderPayload,
  type MagicProviderBatchRequest,
  registerMagicProvider,
  registerMagicProvidersBatch,
  sanitizeProviderPayload,
  findMissingFields,
} from '../../../lib/magic/provider'

const invalidBodyResponse = () =>
  NextResponse.json(
    {
      error:
        'Invalid payload. Provide issuer/audience/jwks_uri or a providers array with those fields.',
    },
    { status: 400 },
  )

const isBatchRequest = (body: unknown): body is MagicProviderBatchRequest => {
  if (!body || typeof body !== 'object') return false
  const maybe = body as Partial<MagicProviderBatchRequest>
  return Array.isArray(maybe.providers)
}

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

  if (isBatchRequest(body)) {
    if (body.providers.length === 0) {
      return NextResponse.json(
        { error: 'At least one provider payload is required.' },
        { status: 400 },
      )
    }

    const batchResult = await registerMagicProvidersBatch(
      secretKey,
      body.providers,
      body.shared_audience,
    )

    if (!batchResult.success) {
      const status = 'details' in batchResult ? 400 : 502
      return NextResponse.json(batchResult, { status })
    }

    return NextResponse.json(batchResult)
  }

  if (!body || typeof body !== 'object') {
    return invalidBodyResponse()
  }

  const payload = sanitizeProviderPayload(body as MagicProviderPayload)
  const missingFields = findMissingFields(payload)

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`,
      },
      { status: 400 },
    )
  }

  const result = await registerMagicProvider(secretKey, payload)

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details,
      },
      { status: result.status },
    )
  }

  return NextResponse.json({ success: true, provider: result.provider })
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        'POST issuer, audience, and jwks_uri or provide a providers array. Use shared_audience to keep QualifyFirst, JustTheTip, and TiltCheck on the same Magic user pool.',
      required_fields: REQUIRED_FIELDS,
      examples: {
        single: {
          issuer: 'https://your-auth-provider.com',
          audience: 'qualifyfirst-users',
          jwks_uri: 'https://your-auth-provider.com/.well-known/jwks.json',
        },
        batch: {
          shared_audience: 'qualifyfirst-users',
          providers: [
            {
              name: 'QualifyFirst Dashboard',
              issuer: 'https://your-auth-provider.com',
              jwks_uri: 'https://your-auth-provider.com/.well-known/jwks.json',
            },
            {
              name: 'JustTheTip Discord Bot',
              issuer: 'https://your-justthetip-provider.com',
              jwks_uri: 'https://your-justthetip-provider.com/.well-known/jwks.json',
            },
            {
              name: 'TiltCheck Tools',
              issuer: 'https://your-tiltcheck-provider.com',
              jwks_uri: 'https://your-tiltcheck-provider.com/.well-known/jwks.json',
            },
          ],
        },
      },
    },
    { status: 200 },
  )
}
