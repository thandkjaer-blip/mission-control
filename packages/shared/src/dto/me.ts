import type { RoleType } from '../contracts/statuses.js';

export interface MeDto {
  id: string;
  email: string;
  displayName: string;
  role: RoleType;
}
