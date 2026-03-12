import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: number;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: number;
      userId: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: number;
    userId?: number;
  }
}
