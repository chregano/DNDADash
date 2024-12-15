import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { accessToken } = await getAccessToken(req);
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error in token API route:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
