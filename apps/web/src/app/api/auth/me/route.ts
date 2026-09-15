import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null) ||
      request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    if (!decoded?.email) {
      const response = NextResponse.json(
        { success: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Force email normalization for exact database lookup
    const userDoc = await findUserByEmail(decoded.email.toLowerCase().trim());

    if (!userDoc) {
      const response = NextResponse.json(
        { success: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
      // Clear cookie if user no longer exists in DB
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userDoc.id,
          name: userDoc.name || '',
          email: userDoc.email,
          avatar: userDoc.avatar || '',
          role: userDoc.role || 'collector',
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Session verify failed:', error);
    
    const response = NextResponse.json(
      { success: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
    // Clear invalid or expired JWT token
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }
}