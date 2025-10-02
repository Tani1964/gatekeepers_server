import express from 'express';
import { ImageController, upload } from '../controllers/imageController';
// import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const imageController = new ImageController();

// Upload single profile image
router.post(
  '/upload',
//   authMiddleware,
  upload.single('image'),
  imageController.uploadProfileImage.bind(imageController)
);

// Delete profile image
router.delete(
  '/delete',
//   authMiddleware,
  imageController.deleteProfileImage.bind(imageController)
);

// Upload multiple images (gallery)
router.post(
  '/upload-multiple',
//   authMiddleware,
  upload.array('images', 10), // Max 10 images
  imageController.uploadMultiple.bind(imageController)
);

export default router;