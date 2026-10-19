import { localRepositories } from './local';
import type { Repositories } from './types';

// Swap the backend here. Screens and stores only ever import `repos`.
export const repos: Repositories = localRepositories;

export { AuthError } from './types';
export type { Repositories } from './types';
