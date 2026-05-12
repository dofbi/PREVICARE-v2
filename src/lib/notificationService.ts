
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  // category: 'ipres' | 'documents' | 'carriere' | 'juridique' | 'formation' | 'system' | 'assistance';
  category: 'ipres' | 'documents' | 'carriere' | 'juridique' | 'formation' | 'system' | 'assistance';
  title: string;
  message: string;
  date: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  user_id?: string;
}

export interface NotificationFilters {
  type?: Notification['type'];
  category?: Notification['category'];
  priority?: Notification['priority'];
  read?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Charger les notifications depuis l'API ou le mock
  async loadNotifications(): Promise<Notification[]> {
    try {
      // Mock notifications statiques pour le développement
      const mockNotifications: Notification[] = [
        // {
        //   id: 'notif_1',
        //   type: 'info',
        //   priority: 'medium',
        //   category: 'ipres',
        //   title: 'Cotisations IPRES mises à jour',
        //   message: 'Vos cotisations IPRES du mois dernier ont été validées.',
        //   date: new Date().toISOString(),
        //   read: false,
        //   action_url: '/espace-employes/ipres',
        //   action_label: 'Voir IPRES'
        // },
        {
          id: 'notif_2',
          type: 'success',
          priority: 'low',
          category: 'documents',
          title: 'Document archivé',
          message: 'Votre contrat de travail a été archivé avec succès.',
          date: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          action_url: '/espace-employes/documents',
          action_label: 'Voir documents'
        }
      ];
      this.notifications = mockNotifications;
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      return [];
    }
  }

  // Créer une nouvelle notification
  createNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();
    return newNotification;
  }

  // Filtrer les notifications
  getNotifications(filters?: NotificationFilters): Notification[] {
    let filtered = [...this.notifications];

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(n => n.type === filters.type);
      }
      if (filters.category) {
        filtered = filtered.filter(n => n.category === filters.category);
      }
      if (filters.priority) {
        filtered = filtered.filter(n => n.priority === filters.priority);
      }
      if (filters.read !== undefined) {
        filtered = filtered.filter(n => n.read === filters.read);
      }
      if (filters.dateRange) {
        filtered = filtered.filter(n => {
          const notifDate = new Date(n.date);
          return notifDate >= filters.dateRange!.start && notifDate <= filters.dateRange!.end;
        });
      }
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Marquer comme lu/non lu
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAsUnread(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = false;
      this.notifyListeners();
    }
  }

  // Marquer toutes comme lues
  markAllAsRead(category?: Notification['category']): void {
    this.notifications.forEach(notification => {
      if (!category || notification.category === category) {
        notification.read = true;
      }
    });
    this.notifyListeners();
  }

  // Supprimer une notification
  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(category?: Notification['category']): number {
    return this.notifications.filter(n => 
      !n.read && (!category || n.category === category)
    ).length;
  }

  // S'abonner aux changements
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.notifications]));
  }

  // Méthodes spécialisées pour créer des notifications par catégorie
  // createIPRESNotification(title: string, message: string, type: Notification['type'] = 'info', priority: Notification['priority'] = 'medium') {
  //   return this.createNotification({
  //     type,
  //     priority,
  //     category: 'ipres',
  //     title,
  //     message,
  //     action_url: '/espace-employes/ipres',
  //     action_label: 'Voir IPRES'
  //   });
  // }

  createDocumentNotification(title: string, message: string, type: Notification['type'] = 'info') {
    return this.createNotification({
      type,
      priority: 'medium',
      category: 'documents',
      title,
      message,
      action_url: '/espace-employes/documents',
      action_label: 'Voir documents'
    });
  }

  createJuridiqueNotification(title: string, message: string, priority: Notification['priority'] = 'high') {
    return this.createNotification({
      type: 'warning',
      priority,
      category: 'juridique',
      title,
      message,
      action_url: '/espace-employes/juridique',
      action_label: 'Consulter'
    });
  }

  // createCareerNotification(title: string, message: string) {
  //   return this.createNotification({
  //     type: 'info',
  //     priority: 'medium',
  //     category: 'carriere',
  //     title,
  //     message,
  //     action_url: '/espace-employes/carriere',
  //     action_label: 'Voir carrière'
  //   });
  // }

  createFormationNotification(title: string, message: string) {
    return this.createNotification({
      type: 'info',
      priority: 'medium',
      category: 'formation',
      title,
      message,
      action_url: '/espace-employes/formation',
      action_label: 'Voir formations'
    });
  }
}

// Instance globale
export const notificationService = NotificationService.getInstance();
