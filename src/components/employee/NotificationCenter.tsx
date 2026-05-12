
import React, { useState, useEffect } from 'react';
import { notificationService, type Notification, type NotificationFilters } from '../../lib/notificationService.ts';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les notifications au montage
    const loadData = async () => {
      setLoading(true);
      await notificationService.loadNotifications();
      setNotifications(notificationService.getNotifications());
      setLoading(false);
    };

    loadData();

    // S'abonner aux changements
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  const getFilteredNotifications = (): Notification[] => {
    const filters: NotificationFilters = {};
    
    switch (filter) {
      case 'unread':
        filters.read = false;
        break;
      case 'ipres':
        filters.category = 'ipres';
        break;
      case 'documents':
        filters.category = 'documents';
        break;
      case 'carriere':
        filters.category = 'carriere';
        break;
      case 'juridique':
        filters.category = 'juridique';
        break;
      case 'formation':
        filters.category = 'formation';
        break;
      case 'system':
        filters.category = 'system';
        break;
      case 'assistance':
        filters.category = 'assistance';
        break;
      default:
        // 'all' - pas de filtre
        break;
    }

    return notificationService.getNotifications(filters);
  };

  const filteredNotifications = getFilteredNotifications();

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const deleteNotification = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
      case 'urgent':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    return 'Il y a quelques minutes';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ipres': return 'IPRES';
      case 'documents': return 'Documents';
      case 'carriere': return 'Carrière';
      case 'juridique': return 'Juridique';
      case 'formation': return 'Formation';
      case 'system': return 'Système';
      case 'assistance': return 'Assistance';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ipres': return 'bg-purple-100 text-purple-800';
      case 'documents': return 'bg-green-100 text-green-800';
      case 'carriere': return 'bg-blue-100 text-blue-800';
      case 'juridique': return 'bg-red-100 text-red-800';
      case 'formation': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'assistance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions globales */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Centre de notifications</h3>
              <p className="text-sm text-gray-500">
                {notificationService.getUnreadCount()} notification{notificationService.getUnreadCount() > 1 ? 's' : ''} non lue{notificationService.getUnreadCount() > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Tout marquer comme lu
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'unread', label: 'Non lues', count: notificationService.getUnreadCount() },
              { key: 'ipres', label: 'IPRES', count: notificationService.getUnreadCount('ipres') },
              { key: 'documents', label: 'Documents', count: notificationService.getUnreadCount('documents') },
              { key: 'carriere', label: 'Carrière', count: notificationService.getUnreadCount('carriere') },
              { key: 'juridique', label: 'Juridique', count: notificationService.getUnreadCount('juridique') },
              { key: 'formation', label: 'Formation', count: notificationService.getUnreadCount('formation') },
              { key: 'assistance', label: 'Assistance', count: notificationService.getUnreadCount('assistance') },
              { key: 'system', label: 'Système', count: notificationService.getUnreadCount('system') }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
                {filterOption.count !== undefined && filterOption.count > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 17H8a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v4.5" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune notification</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' ? 'Pas de notifications pour le moment.' : `Pas de notifications pour "${filter}".`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${notification.type === 'urgent' ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                          {notification.type === 'urgent' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              URGENT
                            </span>
                          )}
                        </h4>
                        <time className="text-xs text-gray-500 ml-4">
                          {formatDate(notification.date)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
                          {getCategoryLabel(notification.category)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.action_label || 'Voir plus'}
                            </a>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Marquer comme lu
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
