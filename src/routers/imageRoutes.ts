import express from 'express';
import { ImageController, upload } from '../controllers/imageController';

const router = express.Router();
const imageController = new ImageController();

router.get('', (req, res) => {
  res.send({ message: "Upload endpoint working" });
});

// Single image upload - NO AUTH
router.post(
  '',
  upload.single('image'),
  imageController.uploadProfileImage.bind(imageController)
);

// Delete - REQUIRES AUTH (keep commented if not using)
router.delete(
  'delete',
  // authMiddleware,  // Keep commented
  imageController.deleteProfileImage.bind(imageController)
);

// Multiple images - NO AUTH
router.post(
  'upload-multiple',
  upload.array('images', 10),
  imageController.uploadMultiple.bind(imageController)
);

export default router;
