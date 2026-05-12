
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export type AssistantType = 'previcare' | 'setlou';

const CONFIGS: Record<AssistantType, {
  apiEndpoint: string;
  defaultInitialMessage: string;
  defaultQuestions: string[];
  storageKey: string;
}> = {
  previcare: {
    apiEndpoint: '/api/assistant',
    defaultInitialMessage: 'Bonjour ! Je suis l\'Assistant PREVICARE, votre guide pour utiliser l\'application. Comment puis-je vous aider ?',
    defaultQuestions: [
      'Comment accéder à mes documents ?',
      'Comment utiliser la Jurithèque ?',
      'Comment rédiger un courrier avec Xalima ?',
      'Que peut faire SETLOU pour moi ?',
    ],
    storageKey: 'previcare_assistant_chat'
  },
  setlou: {
    apiEndpoint: '/api/ai/setlou',
    defaultInitialMessage: 'Bonjour ! Je suis SETLOU, votre conseiller IA en droit du travail sénégalais. Posez-moi vos questions sur vos droits, les procédures RH ou toute situation juridique liée à votre emploi.',
    defaultQuestions: [
      'Quels sont mes droits en cas de licenciement ?',
      'Comment contester une sanction disciplinaire ?',
      'Que faire en cas de non-paiement de salaire ?',
      'Quelles sont les conditions légales du préavis ?',
    ],
    storageKey: 'previcare_setlou_chat'
  }
};

const getDefaultMessages = (initialMessage: string): ChatMessage[] => [{
  id: '1',
  type: 'bot',
  message: initialMessage,
  timestamp: new Date()
}];

const loadChatHistory = (storageKey: string, initialMessage: string): ChatMessage[] => {
  if (typeof window === 'undefined') {
    return getDefaultMessages(initialMessage);
  }
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
  }
  return getDefaultMessages(initialMessage);
};

const saveChatHistory = (storageKey: string, messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'historique:', error);
  }
};

interface AssistanceChatProps {
  variant?: 'compact' | 'full';
  assistantType?: AssistantType;
  predefinedQuestions?: string[];
  initialMessage?: string;
  context?: string;
  userRole?: string;
  userId?: string;
  userTier?: string;
}

export const AssistanceChat: React.FC<AssistanceChatProps> = ({
  variant = 'compact',
  assistantType = 'previcare',
  predefinedQuestions,
  initialMessage,
  context = '',
  userRole,
  userId,
  userTier,
}) => {
  const config = CONFIGS[assistantType];
  const effectiveInitialMessage = initialMessage || config.defaultInitialMessage;
  const effectiveQuestions = predefinedQuestions || config.defaultQuestions;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatHistory(config.storageKey, effectiveInitialMessage)
  );
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuestions, setShowQuestions] = useState(messages.length === 1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messageMaxWidth = variant === 'full' ? 'max-w-4xl' : 'max-w-[85%]';

  useEffect(() => {
    saveChatHistory(config.storageKey, messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setShowQuestions(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory, context, userRole, userId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec l\'assistant');
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: 'Désolé, une erreur s\'est produite. Veuillez réessayer plus tard.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const effectiveTier = userTier || null;
  const isAiLocked = assistantType === 'setlou' && (!effectiveTier || effectiveTier === 'essentiel');

  return (
    <div
      className={`flex flex-col ${variant === 'full' ? 'h-[500px]' : 'h-full'}`}
      style={{ background: 'var(--paper)' }}
    >
      {isAiLocked && (
        <div className="px-4 py-3 border-b" style={{ background: 'rgba(201,169,97,.08)', borderColor: 'var(--rule)' }}>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--gold-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
              L'assistant IA est disponible à partir de la formule <strong>Silver</strong>. <a href="/formules" style={{ color: 'var(--gold)' }}>Voir les formules →</a>
            </p>
          </div>
        </div>
      )}
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`${messageMaxWidth} px-4 py-2.5 rounded-2xl`}
              style={
                message.type === 'user'
                  ? { background: 'var(--ink)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                  : { background: '#fff', color: 'var(--ink)', border: '1px solid var(--rule)', borderRadius: '18px 18px 18px 4px' }
              }
            >
              {message.type === 'bot' ? (
                <div className="text-sm prose prose-sm max-w-none"
                  style={{ color: 'var(--ink)' } as React.CSSProperties}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.message}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.message}</p>
              )}
              <p className="text-[10px] mt-1"
                style={{ color: message.type === 'user' ? 'rgba(255,255,255,.45)' : 'var(--ink-4)' }}>
                {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl border" style={{ background: '#fff', borderColor: 'var(--rule)', borderRadius: '18px 18px 18px 4px' }}>
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--gold)' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--gold)', animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--gold)', animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {showQuestions && effectiveQuestions.length > 0 && (
        <div className="px-4 pb-2 border-t" style={{ borderColor: 'var(--rule)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--ink-4)' }}>
            Questions fréquentes
          </p>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {effectiveQuestions.slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors text-left"
                style={{ borderColor: 'var(--rule-gold)', color: 'var(--gold-3)', background: 'rgba(201,169,97,.08)' }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--rule)', background: '#fff' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputMessage)}
            placeholder={isAiLocked ? "Passez en Silver ou Gold pour accéder à l'IA…" : "Votre question…"}
            className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none"
            style={{
              borderColor: 'var(--rule)',
              color: 'var(--ink)',
              background: 'var(--paper)'
            }}
            disabled={isTyping || isAiLocked}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={isTyping || !inputMessage.trim() || isAiLocked}
            className="px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--ink)', color: 'var(--gold)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
