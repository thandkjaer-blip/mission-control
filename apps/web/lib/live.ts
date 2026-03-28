export function getLiveUrl() {
  return process.env.NEXT_PUBLIC_LIVE_URL ?? 'ws://localhost:4001/api/v1/live';
}
