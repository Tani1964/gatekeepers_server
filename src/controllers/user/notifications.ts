import { User } from "../../models/User";

export class NotificationController {
  async getNotifications(req: any, res: any) {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.notifications || [],
    });
  }

  static async sendNotificationToUser(userId: string, title: string, message: string) {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error("User not found");
    }
    
    const newNotification = {
        title,
        message,
        read: false,
        date: new Date(),
    };
    
    user.notifications = user.notifications || [];
    user.notifications.push(newNotification);
    await user.save();
    
    return newNotification;
  }

  async sendNotification(req: any, res: any) {
    const { userId, title, message } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
    
    const newNotification = {
        title,
        message,
        read: false,
        date: new Date(),
    };
    
    user.notifications = user.notifications || [];
    user.notifications.push(newNotification);
    await user.save();
    
    res.status(200).json({
        success: true,
        message: "Notification sent successfully",
        data: newNotification,
    });
  }



  async markAsRead(req: any, res: any) {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = user.notifications?.id(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.read = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  }
}   