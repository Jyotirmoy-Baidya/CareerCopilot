// All fetch calls to microservices from server components go through here.
// Client components call /api/* proxy routes instead.
// Every function catches network errors and returns a safe fallback so pages
// never crash when a service is temporarily unreachable.

const AUTH_URL  = process.env.AUTH_SERVICE_URL!;
const RECOMMEND = process.env.RECOMMENDATION_SERVICE_URL!;

export async function fetchRoadmap(accessToken: string, targetRole: string) {
  try {
    const res = await fetch(`${RECOMMEND}/recommendation/roadmap`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body:    JSON.stringify({ targetRole }),
      cache:   'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchDailyTasks(accessToken: string, roadmapId: string) {
  try {
    const res = await fetch(`${RECOMMEND}/recommendation/daily-tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body:    JSON.stringify({ roadmapId }),
      cache:   'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tasks ?? [];
  } catch {
    return [];
  }
}

export async function fetchMe(accessToken: string) {
  try {
    const res = await fetch(`${AUTH_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache:   'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
