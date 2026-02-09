/**
 * Service de notifications locales
 * Utilise @capacitor/local-notifications pour envoyer des notifications
 */
import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  /**
   * Initialise les notifications locales et demande les permissions
   */
  async initialize() {
    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== 'granted') {
        console.warn('Les permissions de notification n\'ont pas été accordées');
        return false;
      }

      // Écouter les actions sur les notifications
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action:', notification);
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  },

  /**
   * Vérifie les permissions de notification
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  },

  /**
   * Envoie une notification de changement de statut
   * @param {Object} signalement - Le signalement mis à jour
   * @param {string} ancienStatut - L'ancien statut
   * @param {string} nouveauStatut - Le nouveau statut
   */
  async notifyStatusChange(signalement, ancienStatut, nouveauStatut) {
    const statutLabels = {
      NOUVEAU: 'Nouveau',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
    };

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: signalement.id,
            title: 'Mise à jour de signalement',
            body: `Le signalement "${signalement.titre}" est passé de "${statutLabels[ancienStatut] || ancienStatut}" à "${statutLabels[nouveauStatut] || nouveauStatut}"`,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#3880ff',
            extra: {
              signalementId: signalement.id,
              type: 'status_change',
            },
          },
        ],
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  },

  /**
   * Envoie une notification simple
   * @param {string} title - Le titre de la notification
   * @param {string} body - Le corps de la notification
   * @param {number} id - L'identifiant unique (optionnel)
   */
  async sendNotification(title, body, id = Date.now()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
          },
        ],
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  },

  /**
   * Annule toutes les notifications en attente
   */
  async cancelAll() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  },
};

