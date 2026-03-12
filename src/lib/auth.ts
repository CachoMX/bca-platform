import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        // Old app convention: Status=0/NULL means active, Status=1 means blocked
        if (!user || user.status === true) return null;

        if (!user.password) return null;

        // Support both bcrypt hashes and legacy plaintext passwords
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        const passwordValid = isHashed
          ? await bcrypt.compare(password, user.password)
          : user.password === password;

        if (!passwordValid) return null;

        return {
          id: String(user.idUser),
          name: `${user.name} ${user.lastname}`,
          email: user.email ?? '',
          role: user.idRole ?? undefined,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role: number }).role = token.role as number;
        (session.user as { userId: number }).userId = token.userId as number;
      }
      return session;
    },
  },
});
