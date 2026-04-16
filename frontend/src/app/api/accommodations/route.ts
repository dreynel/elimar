import { NextResponse } from 'next/server'

import { FALLBACK_ACCOMMODATIONS } from '@/lib/accommodations-fallback'

export const dynamic = 'force-dynamic'

const LIVE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET() {
  try {
    const response = await fetch(`${LIVE_API_URL}/api/accommodations`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Live API responded with ${response.status}`)
    }

    const payload = await response.json()

    return NextResponse.json({
      ...payload,
      meta: {
        usingFallback: false,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}. Showing the local accommodations catalog while the reservation service is unavailable.`
        : 'Showing the local accommodations catalog while the reservation service is unavailable.'

    return NextResponse.json({
      success: true,
      message: 'Using local accommodations catalog',
      data: FALLBACK_ACCOMMODATIONS,
      meta: {
        usingFallback: true,
        error: message,
      },
    })
  }
}
