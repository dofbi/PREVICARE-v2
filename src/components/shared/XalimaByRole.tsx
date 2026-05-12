import { XalimaForm } from '../employee/XalimaForm';
import { type UserRole } from '../../config/roleConfig';

interface XalimaByRoleProps {
  userRole: UserRole;
  userProfile?: {
    employee_name?: string;
    employee_position?: string;
    company_name?: string;
    recipient?: string;
  };
}

export function XalimaByRole({ userRole, userProfile }: XalimaByRoleProps) {
  return (
    <XalimaForm
      userRole={userRole}
      userProfile={userProfile}
    />
  );
}
