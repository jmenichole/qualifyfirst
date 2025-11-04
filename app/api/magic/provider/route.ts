/**
 * QualifyFirst - Magic Identity Provider Registration Route
 *
 * Allows the dashboard to programmatically register an external
 * authentication provider with Magic using the Magic Admin API.
 */

import { NextResponse } from 'next/server'

const MAGIC_PROVIDER_ENDPOINT = 'https://tee.express.magiclabs.com/v1/identity/provider'

type MagicProviderPayload = {
  issuer?: string
  audience?: string
  jwks_uri?: string
}

const REQUIRED_FIELDS: (keyof Required<MagicProviderPayload>)[] = ['issuer', 'audience', 'jwks_uri']

export async function POST(request: Request) {
  const secretKey = process.env.MAGIC_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json(
      {
        error: 'Magic secret key is not configured. Set MAGIC_SECRET_KEY in your environment.',
      },
      { status: 500 },
    )
  }

  let payload: MagicProviderPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const sanitizedPayload: Record<(typeof REQUIRED_FIELDS)[number], string> = {
    issuer: typeof payload.issuer === 'string' ? payload.issuer.trim() : '',
    audience: typeof payload.audience === 'string' ? payload.audience.trim() : '',
    jwks_uri: typeof payload.jwks_uri === 'string' ? payload.jwks_uri.trim() : '',
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !sanitizedPayload[field])

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`,
      },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(MAGIC_PROVIDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Magic-Secret-Key': secretKey,
      },
      body: JSON.stringify(sanitizedPayload),
    })

    const responseBody = await response
      .json()
      .catch(() => ({ message: 'Magic API did not return JSON content.' }))

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Magic API request failed.',
          details: responseBody,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, provider: responseBody })
  } catch (error) {
    console.error('Magic provider registration failed:', error)
    return NextResponse.json(
      {
        error: 'Unable to register Magic provider. Verify network connectivity and credentials.',
      },
      { status: 502 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        'POST issuer, audience, and jwks_uri to register a Magic provider. This endpoint proxies the Magic Admin API using the configured secret key.',
      required_fields: REQUIRED_FIELDS,
    },
    { status: 200 },
  )
}
