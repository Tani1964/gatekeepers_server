import { Request, Response } from 'express';
import { User } from '../models/User';
import notificationService from '../services/notificationService';

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Save or update user's push token
export const savePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken, device } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!pushToken) {
      res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
      return;
    }

    // Update user's push token
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        pushToken,
        $addToSet: {
          pushTokens: {
            token: pushToken,
            device: device || 'unknown',
            lastUsed: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Push token saved successfully',
      data: { pushToken: user.pushToken },
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push token',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Send a test notification
export const sendTestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user || !user.pushToken) {
      res.status(404).json({
        success: false,
        message: 'No push token found for user',
      });
      return;
    }

    const result = await notificationService.sendPushNotification(
      user.pushToken,
      {
        title: 'Test Notification',
        body: 'This is a test notification from your app!',
        data: { type: 'test' },
      }
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const preferences = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    ).select('notificationPreferences');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Remove push token (logout/disable)
export const removePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { pushToken } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const updateQuery: any = {
      $pull: { pushTokens: { token: pushToken } },
    };

    if (pushToken) {
      updateQuery.$unset = { pushToken: 1 };
    }

    await User.findByIdAndUpdate(userId, updateQuery);

    res.status(200).json({
      success: true,
      message: 'Push token removed successfully',
    });
  } catch (error) {
    console.error('Error removing push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};