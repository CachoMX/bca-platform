import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { rateLimit } from './rate-limit';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Rate limit: 5 attempts per 15 minutes per email
        const limiter = rateLimit(`login:${email}`, 5, 15 * 60 * 1000);
        if (!limiter.success) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        // Status convention: status=true means blocked/inactive, null/false means active
        if (!user || user.status === true) return null;

        if (!user.password) return null;

        // Support both bcrypt hashes and legacy plaintext passwords
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        const passwordValid = isHashed
          ? await bcrypt.compare(password, user.password)
          : user.password === password;

        if (!passwordValid) return null;

        // Opportunistic re-hash: upgrade plaintext passwords to bcrypt 12
        if (!isHashed) {
          try {
            const hashed = await bcrypt.hash(password, 12);
            await prisma.user.update({
              where: { idUser: user.idUser },
              data: { password: hashed },
            });
          } catch {
            // Non-fatal: login still succeeds even if re-hash fails
          }
        }

        // Load permissions for this role from DB
        const rolePerms = await prisma.rolePermission.findMany({
          where: { idRole: user.idRole ?? 0, enabled: true },
          select: { permissionKey: true },
        });

        return {
          id: String(user.idUser),
          name: `${user.name} ${user.lastname}`,
          email: user.email ?? '',
          role: user.idRole ?? undefined,
          permissions: rolePerms.map((p) => p.permissionKey),
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 10 * 60 * 60, // 10 hours
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: number }).role;
        token.userId = Number(user.id);
        token.permissions = (user as { permissions: string[] }).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.role = token.role as number;
        u.userId = token.userId as number;
        u.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
});
