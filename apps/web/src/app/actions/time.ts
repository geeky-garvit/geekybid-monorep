// src/app/actions/time.ts
'use server';

export async function getServerTime(): Promise<number> {
  // Returns current UTC timestamp directly from the hosting environment
  return Date.now();
}