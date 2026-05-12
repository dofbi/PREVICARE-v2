
import React from 'react';

export function NotificationList() {
  const notifications = [
    {
      id: 1,
      title: "Nouvelle mise à jour IPRES",
      message: "Votre cotisation de mars 2025 a été enregistrée avec succès.",
      time: "Il y a 2 heures",
      type: "info",
      isNew: true
    },
    {
      id: 2,
      title: "Document ajouté",
      message: "Votre bulletin de paie de février 2025 a été archivé.",
      time: "Il y a 1 jour",
      type: "document",
      isNew: false
    },
    {
      id: 3,
      title: "Rappel consultation",
      message: "N'oubliez pas votre rendez-vous juridique demain à 14h.",
      time: "Il y a 2 jours",
      type: "reminder",
      isNew: false
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return '💡';
      case 'document':
        return '📄';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className={`flex items-start space-x-3 p-4 border rounded-lg ${
          notification.isNew ? 'bg-blue-50 border-blue-200' : 'bg-white'
        }`}>
          <div className="text-xl">{getIcon(notification.type)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{notification.title}</p>
              {notification.isNew && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Nouveau
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
