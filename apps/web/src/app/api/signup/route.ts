import { NextResponse } from 'next/server'

interface SignupPayload {
  email?: string
  role?: string
}

export async function POST(request: Request) {
  try {
    const body: SignupPayload = await request.json()
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid work email address.' },
        { status: 400 }
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const backendRes = await fetch(`${apiUrl}/api/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: body.role || 'developer' }),
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to register with waitlist service.' },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { error: 'Malformed request or server error. Please try again.' },
      { status: 500 }
    )
  }
}
