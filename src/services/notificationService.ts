import { Expo, ExpoPushMessage, ExpoPushReceipt, ExpoPushTicket } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface SendNotificationResult {
  success: boolean;
  ticket?: ExpoPushTicket;
  error?: string;
}

interface SendBulkNotificationResult {
  success: boolean;
  tickets?: ExpoPushTicket[];
  error?: string;
}

interface CheckReceiptsResult {
  success: boolean;
  receipts?: { [id: string]: ExpoPushReceipt };
  error?: string;
}

class NotificationService {
  /**
   * Send a push notification to a single device
   */
  async sendPushNotification(
    pushToken: string,
    notification: NotificationPayload
  ): Promise<SendNotificationResult> {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return { success: false, error: 'Invalid push token' };
    }

    // Construct the notification message
    const message: ExpoPushMessage = {
      to: pushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
      priority: notification.priority || 'high',
      channelId: notification.channelId || 'default',
    };

    try {
      // Send the notification
      const ticketChunk = await expo.sendPushNotificationsAsync([message]);
      console.log('Notification sent:', ticketChunk);
      return { success: true, ticket: ticketChunk[0] };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendBulkPushNotifications(
    pushTokens: string[],
    notification: NotificationPayload
  ): Promise<SendBulkNotificationResult> {
    // Filter out invalid tokens
    const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));
    
    if (validTokens.length === 0) {
      console.error('No valid push tokens provided');
      return { success: false, error: 'No valid push tokens' };
    }

    // Construct messages
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
      priority: notification.priority || 'high',
      channelId: notification.channelId || 'default',
    }));

    // Split messages into chunks (Expo recommends chunks of 100)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    try {
      // Send all chunks
      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
      
      console.log(`Sent ${tickets.length} notifications`);
      return { success: true, tickets };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check the status of sent notifications
   */
  async checkNotificationReceipts(ticketIds: string[]): Promise<CheckReceiptsResult> {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    let allReceipts: { [id: string]: ExpoPushReceipt } = {};

    try {
      for (const chunk of receiptIdChunks) {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        allReceipts = { ...allReceipts, ...receiptChunk };
      }
      
      return { success: true, receipts: allReceipts };
    } catch (error) {
      console.error('Error checking receipts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send game start notification
   */
  async sendGameStartNotification(pushTokens: string[], gameTitle: string, gameId: string) {
    return this.sendBulkPushNotifications(pushTokens, {
      title: 'Game Started! 🎮',
      body: `${gameTitle} has begun. Join now!`,
      data: {
        type: 'game_start',
        gameId,
      },
      priority: 'high',
    });
  }

  /**
   * Send game end notification
   */
  async sendGameEndNotification(pushTokens: string[], gameTitle: string, gameId: string) {
    return this.sendBulkPushNotifications(pushTokens, {
      title: 'Game Ended! 🏁',
      body: `${gameTitle} has ended. Check your results!`,
      data: {
        type: 'game_end',
        gameId,
      },
      priority: 'high',
    });
  }

  /**
   * Send game reminder notification
   */
  async sendGameReminderNotification(pushToken: string, gameTitle: string, gameId: string, minutesUntilStart: number) {
    return this.sendPushNotification(pushToken, {
      title: 'Game Starting Soon! ⏰',
      body: `${gameTitle} starts in ${minutesUntilStart} minutes!`,
      data: {
        type: 'game_reminder',
        gameId,
      },
      priority: 'high',
    });
  }

  /**
   * Send friend activity notification
   */
  async sendFriendActivityNotification(pushToken: string, friendName: string, activity: string) {
    return this.sendPushNotification(pushToken, {
      title: 'Friend Activity 👥',
      body: `${friendName} ${activity}`,
      data: {
        type: 'friend_activity',
        friendName,
      },
    });
  }
}

export default new NotificationService();