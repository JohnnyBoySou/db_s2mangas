import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { 
  getProfile, 
  toggleLikeProfile, 
  toggleFollowProfile,
  searchProfiles,
  getSimilarProfiles,
  listProfiles
} from '../controllers/ProfileController';

const ProfileRouter = Router();

ProfileRouter.get('/', requireAuth, listProfiles);
ProfileRouter.get('/search', requireAuth, searchProfiles);
ProfileRouter.get('/:userId/similar', requireAuth, getSimilarProfiles);
ProfileRouter.get('/:username', requireAuth, getProfile);
ProfileRouter.post('/:username/like', requireAuth, toggleLikeProfile);
ProfileRouter.post('/:username/follow', requireAuth, toggleFollowProfile);

export { ProfileRouter };