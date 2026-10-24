import { Router } from 'express';
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImages', maxCount: 1 },
  ]),
  registerUser,
);
router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/change-password', verifyJWT, changeCurrentPassword);
router.get('/current-user', verifyJWT, getCurrentUser);
router.patch('/update-account', verifyJWT, updateAccountDetails);
router.patch('/avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.patch(
  '/cover-image',
  verifyJWT,
  upload.single('coverImage'),
  updateUserCoverImage,
);


export default router;
