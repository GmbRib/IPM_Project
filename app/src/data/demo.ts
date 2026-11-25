import type { Role } from './types';

// Demo accounts (plan §8, Fase 7): created by the server's seed (src/server/seed.ts) and
// offered on the login screen in development. Teresa organises the test-scenario trips; Rui
// and Pedro start with none, ready to be invited (the role is the one they're meant to get).
export const DEMO_PASSWORD = 'ana12345';

export const DEMO_ACCOUNTS: { id: string; email: string; name: string; role: Role }[] = [
  { id: 'demo-teresa', email: 'teresa.romao@email.pt', name: 'Professora Teresa', role: 'owner' },
  { id: 'demo-rui', email: 'rui@email.pt', name: 'Rui', role: 'admin' },
  { id: 'demo-pedro', email: 'pedro@email.pt', name: 'Pedro', role: 'member' },
];

export const DEMO_EMAIL = DEMO_ACCOUNTS[0].email;
