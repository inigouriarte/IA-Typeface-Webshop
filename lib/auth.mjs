import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { LibsqlDialect } from '@libsql/kysely-libsql';

export const auth = betterAuth({
  database: {
    dialect: new LibsqlDialect({
      url: process.env.TURSO_DATABASE_URL || 'file:data/auth.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    type: 'sqlite',
  },
  baseURL: process.env.BETTER_AUTH_URL || process.env.BASE_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: 'user',
    }),
  ],
});
