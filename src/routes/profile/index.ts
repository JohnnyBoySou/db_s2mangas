import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { 
  getProfile, 
  toggleLikeProfile, 
  toggleFollowProfile 
} from '@/controllers/profile';

const ProfileRouter = Router();

ProfileRouter.get('/:username', requireAuth, getProfile);
ProfileRouter.post('/:username/like', requireAuth, toggleLikeProfile);
ProfileRouter.post('/:username/follow', requireAuth, toggleFollowProfile);

export { ProfileRouter };