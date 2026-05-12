import { AssistanceChat } from '../employee/AssistanceChat';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('expatriate');

interface Props { extraContext?: string; variant?: 'compact' | 'full'; }

export function SetlouExpatriate({ extraContext = '', variant = 'compact' }: Props) {
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
