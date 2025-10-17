import { Session } from 'better-auth/types';

export interface CustomUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: 'USER' | 'ADMIN';
  discordId?: string;
}

export interface CustomSession extends Omit<Session, 'user'> {
  user: CustomUser;
}
