import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `refreshToken=${refreshToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken };
  } catch {
    return null;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${AUTH_URL}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: credentials.email, password: credentials.password }),
        });

        if (!res.ok) return null;

        const { accessToken, refreshToken, user } = await res.json();
        return { ...user, accessToken, refreshToken };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }: any) {
      // Session update triggered by client-side update() call (e.g. after onboarding)
      if (trigger === 'update' && updateData) {
        if (updateData.isOnboarded !== undefined) token.isOnboarded = updateData.isOnboarded;
        if (updateData.targetRole  !== undefined) token.targetRole  = updateData.targetRole;
        return token;
      }

      // First sign-in: user object is populated
      if (user) {
        token.accessToken  = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id           = user.id;
        token.role         = (user as any).role;
        token.targetRole   = (user as any).targetRole;
        token.isOnboarded  = (user as any).isOnboarded;
        // Store expiry from the JWT payload so we know when to refresh
        try {
          const payload = JSON.parse(Buffer.from((token.accessToken as string).split('.')[1], 'base64url').toString());
          token.accessTokenExpires = payload.exp * 1000; // ms
        } catch {
          token.accessTokenExpires = Date.now() + 14 * 60 * 1000; // 14 min fallback
        }
        return token;
      }

      // Token still valid — return as-is
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token expired — try to refresh
      if (!token.refreshToken) return token;
      const refreshed = await refreshAccessToken(token.refreshToken as string);
      if (!refreshed) return token; // keep stale token; session will still exist

      token.accessToken = refreshed.accessToken;
      token.refreshToken = refreshed.refreshToken;
      try {
        const payload = JSON.parse(Buffer.from(refreshed.accessToken.split('.')[1], 'base64url').toString());
        token.accessTokenExpires = payload.exp * 1000;
      } catch {
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken           = token.accessToken as string;
      session.user.id               = (token.id ?? token.sub) as string;
      (session.user as any).role         = token.role;
      (session.user as any).targetRole   = token.targetRole;
      (session.user as any).isOnboarded  = token.isOnboarded;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

declare module 'next-auth' {
  interface Session {
    accessToken: string;
  }
}
