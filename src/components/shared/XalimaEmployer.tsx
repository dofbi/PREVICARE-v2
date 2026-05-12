import { XalimaForm } from '../employee/XalimaForm';

interface Props {
  userProfile?: { employee_name?: string; employee_position?: string; company_name?: string; recipient?: string; };
  userTier?: string | null;
}

export function XalimaEmployer({ userProfile, userTier }: Props) {
  const mode = !userTier || userTier === 'essentiel' ? 'faq' : 'ai';

  return <XalimaForm userRole="employer" userProfile={userProfile} />;
}
