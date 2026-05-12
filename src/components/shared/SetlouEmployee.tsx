import { AssistanceChat } from '../employee/AssistanceChat';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('employee');

interface Props { extraContext?: string; variant?: 'compact' | 'full'; }

export function SetlouEmployee({ extraContext = '', variant = 'compact' }: Props) {
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
