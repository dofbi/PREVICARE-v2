import React, { useState } from 'react';
import { AssistanceChat } from './AssistanceChat.tsx';

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(11,29,58,.5)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed bottom-20 md:bottom-6 right-4 z-50 transition-all duration-300 ${
        isOpen ? 'w-[calc(100vw-2rem)] md:w-96 h-[520px] md:h-[580px]' : 'w-auto h-auto'
      }`}>
        {isOpen && (
          <div className="flex flex-col h-full rounded-2xl shadow-2xl overflow-hidden border"
            style={{ background: '#fff', borderColor: 'var(--rule)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{ background: 'var(--ink)', borderColor: 'rgba(201,169,97,.25)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,169,97,.18)' }}>
                  <svg className="w-5 h-5" style={{ color: 'var(--gold)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Assistant PREVICARE</h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,.50)' }}>En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,.6)' }}
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistanceChat assistantType="previcare" />
            </div>
          </div>
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            style={{ background: 'var(--ink)' }}
            aria-label="Ouvrir l'assistant virtuel"
          >
            <svg className="w-6 h-6" style={{ color: 'var(--gold)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </button>
        )}
      </div>
    </>
  );
};
