import express from 'express';
import {
    getNotificationPreferences,
    removePushToken,
    savePushToken,
    sendTestNotification,
    updateNotificationPreferences,
} from '../controllers/notificationController';
// import { protect } from '../middleware/auth'; // Your auth middleware

const router = express.Router();

// Save push token
router.post('/save-token', savePushToken);

// Send test notification
router.post('/test', sendTestNotification);

// Get notification preferences
router.get('/preferences',  getNotificationPreferences);

// Update notification preferences
router.put('/preferences',  updateNotificationPreferences);

// Remove push token
router.delete('/remove-token',  removePushToken);

export default router;