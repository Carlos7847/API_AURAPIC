import { UserRole } from '../enums/user-role.enum';

export interface ActiveUserData {
  userId: string;
  email: string;
  role: UserRole;
}
