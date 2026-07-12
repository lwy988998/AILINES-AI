import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  return NextResponse.json({ user });
}
