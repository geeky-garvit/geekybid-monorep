import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export interface UserDocument {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: string;
  createdAt: Date;
}

export type SafeUser = Omit<UserDocument, 'passwordHash'>;

/**
 * Finds a user by lowercased, trimmed email.
 */
export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Finds a user by unique ID string.
 */
export async function findUserById(id: string): Promise<SafeUser | null> {
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Hashes password and persists a new user record in PostgreSQL via Prisma.
 */
export async function createUser(data: {
  name: string;
  email: string;
  passwordRaw: string;
  role?: string;
}): Promise<SafeUser> {
  const cleanEmail = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(data.name.trim())}`;

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash,
      avatar: avatarUrl,
      role: data.role || 'collector',
    },
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    avatar: newUser.avatar ?? avatarUrl,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };
}

/**
 * Compares raw text password against stored hash.
 */
export async function verifyUserPassword(
  passwordRaw: string,
  passwordHash: string
): Promise<boolean> {
  return await bcrypt.compare(passwordRaw, passwordHash);
}

/**
 * Updates profile information (name, avatar) for a user.
 */
export async function updateUserProfile(
  id: string,
  updates: Partial<Pick<UserDocument, 'name' | 'avatar'>>
): Promise<SafeUser | null> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.avatar ? { avatar: updates.avatar } : {}),
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar ?? '',
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    };
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return null;
  }
}