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

    // In a production deployment, persist to Supabase, Postgres, Loops, or Resend
    // For now, securely simulate successful queuing of early access
    const confirmationId = `stn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    return NextResponse.json(
      {
        success: true,
        message: "You're on the early access priority list. We'll be in touch with onboarding credentials.",
        confirmationId,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Malformed request or server error. Please try again.' },
      { status: 500 }
    )
  }
}
