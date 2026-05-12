import { AssistanceChat } from '../employee/AssistanceChat';
import { getRoleConfig, type UserRole } from '../../config/roleConfig';

interface SetlouByRoleProps {
  userRole: UserRole;
  variant?: 'compact' | 'full';
  extraContext?: string;
}

export function SetlouByRole({ userRole, variant = 'compact', extraContext = '' }: SetlouByRoleProps) {
  const config = getRoleConfig(userRole);

  return (
    <AssistanceChat
      assistantType="setlou"
      variant={variant}
      initialMessage={config.setlouInitialMessage}
      predefinedQuestions={config.setlouDefaultQuestions}
      context={extraContext ? `${config.setlouContext}\n\n${extraContext}` : config.setlouContext}
    />
  );
}
