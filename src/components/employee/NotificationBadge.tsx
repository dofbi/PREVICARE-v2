
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../lib/notificationService.ts';

interface NotificationBadgeProps {
  // category?: 'ipres' | 'documents' | 'carriere' | 'juridique' | 'formation' | 'system' | 'assistance';
  category?: 'documents' | 'juridique' | 'formation' | 'system' | 'assistance';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ category, className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(notificationService.getUnreadCount(category));
    };

    // Mise à jour initiale
    updateCount();

    // S'abonner aux changements
    const unsubscribe = notificationService.subscribe(() => {
      updateCount();
    });

    return unsubscribe;
  }, [category]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};
