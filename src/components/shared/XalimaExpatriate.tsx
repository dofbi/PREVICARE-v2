import { XalimaForm } from '../employee/XalimaForm';

interface Props {
  userProfile?: { employee_name?: string; employee_position?: string; company_name?: string; recipient?: string; };
}

export function XalimaExpatriate({ userProfile }: Props) {
  return <XalimaForm userRole="expatriate" userProfile={userProfile} />;
}
