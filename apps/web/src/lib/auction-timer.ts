export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  totalRemainingMs: number;
}

export function calculateTimeRemaining(
  endTimeISO: string | Date,
  currentServerTimeMs: number = Date.now()
): TimeLeft {
  const endMs = new Date(endTimeISO).getTime();

  // Fallback if endTimeISO is an invalid date string
  if (isNaN(endMs)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      totalRemainingMs: 0,
    };
  }

  const totalRemainingMs = endMs - currentServerTimeMs;

  if (totalRemainingMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      totalRemainingMs: 0,
    };
  }

  const seconds = Math.floor((totalRemainingMs / 1000) % 60);
  const minutes = Math.floor((totalRemainingMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalRemainingMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalRemainingMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isEnded: false,
    totalRemainingMs,
  };
}

/**
 * Formats time remaining into a clean human-readable string (e.g. "2d 04h 12m 30s")
 */
export function formatTimeRemaining(timeLeft: TimeLeft): string {
  if (timeLeft.isEnded) return 'Ended';

  const pad = (n: number) => String(n).padStart(2, '0');
  const parts: string[] = [];

  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${pad(timeLeft.hours)}h`);
  parts.push(`${pad(timeLeft.minutes)}m`);
  parts.push(`${pad(timeLeft.seconds)}s`);

  return parts.join(' ');
}