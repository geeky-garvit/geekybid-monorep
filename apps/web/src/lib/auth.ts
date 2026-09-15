import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface UserSession {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  role?: string;
}

export async function getAuthUser(request?: Request): Promise<UserSession | null> {
  try {
    let token: string | undefined;

    // 1. Check Bearer token from HTTP Header (used by mobile app)
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // 2. Fall back to Next.js Cookies (used by web app)
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }

    if (!token) {
      return null;
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      sub?: string;
      email: string;
      role?: string;
      name?: string;
      avatar?: string;
    };

    // Resolves user ID across different JWT payload naming standards
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      console.error('[Auth Error]: Valid JWT decoded, but no user ID present.');
      return null;
    }

    return {
      id: userId,
      email: decoded.email,
      name: decoded.name,
      avatar: decoded.avatar,
      role: decoded.role || 'user',
    };
  } catch (error) {
    return null;
  }
}

// Backwards-compatibility export
export const getCurrentUser = getAuthUser;