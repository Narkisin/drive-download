import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('google_tokens')
  
  return NextResponse.json({
    authenticated: !!tokenCookie,
  })
}

