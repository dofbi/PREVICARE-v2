import { AssistanceChat } from '../employee/AssistanceChat';
import { getRoleConfig } from '../../config/roleConfig';

const config = getRoleConfig('delegate');

interface Props {
  extraContext?: string;
  variant?: 'compact' | 'full';
  userTier?: string | null;
  userId?: string;
}

const FAQ_MESSAGE_DELEGATE = "Bonjour ! Pour acc\u00e9der \u00e0 l\u2019assistant IA, souscrivez \u00e0 la formule Silver ou Gold.";

export function SetlouDelegate({ extraContext = '', variant = 'compact', userTier, userId }: Props) {
  const isLocked = !userTier || userTier === 'essentiel';

  return (
    <AssistanceChat
      assistantType="setlou"
      variant={variant}
      initialMessage={isLocked ? FAQ_MESSAGE_DELEGATE : config.setlouInitialMessage}
      predefinedQuestions={isLocked ? [] : config.setlouDefaultQuestions}
      context={extraContext ? `${config.setlouContext}\n\n${extraContext}` : config.setlouContext}
      userRole="delegate"
      userId={userId}
      userTier={userTier || undefined}
    />
  );
}