import { eq } from 'drizzle-orm';
import { db } from '../client';
import { users, sessions, type User, type NewUser } from '../schema';

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function findUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<NewUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function createSession(userId: string, token: string, expiresAt: Date) {
  const [session] = await db
    .insert(sessions)
    .values({ userId, token, expiresAt })
    .returning();
  return session;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}
