
import React, { useState } from 'react';

interface CareerEvent {
  id: string;
  date: string;
  type: 'job' | 'promotion' | 'formation' | 'contract';
  title: string;
  company: string;
  description: string;
  salary?: number;
}

const mockEvents: CareerEvent[] = [
  {
    id: '1',
    date: '2024-03-15',
    type: 'promotion',
    title: 'Promotion - Lead Developer',
    company: 'TechCorp SARL',
    description: 'Promotion au poste de Lead Developer avec une équipe de 5 développeurs',
    salary: 950000
  },
  {
    id: '2',
    date: '2022-03-01',
    type: 'job',
    title: 'Développeur Senior',
    company: 'TechCorp SARL',
    description: 'Rejoint TechCorp en tant que développeur senior, spécialisé en React et Node.js',
    salary: 850000
  },
  {
    id: '3',
    date: '2021-11-15',
    type: 'formation',
    title: 'Certification AWS',
    company: 'AWS Training Center',
    description: 'Obtention de la certification AWS Solutions Architect Associate'
  },
  {
    id: '4',
    date: '2019-06-01',
    type: 'job',
    title: 'Développeur Full-Stack',
    company: 'StartupX',
    description: 'Premier poste en tant que développeur full-stack dans une startup fintech',
    salary: 650000
  },
  {
    id: '5',
    date: '2018-01-15',
    type: 'job',
    title: 'Développeur Junior',
    company: 'WebAgency Dakar',
    description: 'Début de carrière comme développeur junior après mes études',
    salary: 450000
  }
];

export const CareerTimeline: React.FC = () => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'job':
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6a2 2 0 00-2 2v6" />
          </svg>
        );
      case 'formation':
        return (
          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {mockEvents.map((event, eventIndex) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIndex !== mockEvents.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                    {getEventIcon(event.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500">{event.company}</p>
                      </div>
                      <div className="text-right">
                        <time className="text-sm text-gray-500">{formatDate(event.date)}</time>
                        {event.salary && (
                          <p className="text-sm font-medium text-green-600">
                            {event.salary.toLocaleString()} CFA
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {expandedEvent === event.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700">{event.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            event.type === 'promotion' ? 'bg-green-100 text-green-800' :
                            event.type === 'job' ? 'bg-blue-100 text-blue-800' :
                            event.type === 'formation' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.type === 'promotion' ? 'Promotion' :
                             event.type === 'job' ? 'Nouveau poste' :
                             event.type === 'formation' ? 'Formation' : 'Contrat'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
