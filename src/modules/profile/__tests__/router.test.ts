import request from 'supertest';
import express from 'express';
import { ProfileRouter } from '../routes/ProfileRouter';
import * as profileController from '../controllers/ProfileController';
import { requireAuth } from '../../../middlewares/auth';

// Mock dos controladores
jest.mock('../controllers/ProfileController');
jest.mock('../../../middlewares/auth');

const mockedProfileController = profileController as jest.Mocked<typeof profileController>;
const mockedRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// Extend Request type to include user property
interface AuthenticatedRequest extends express.Request {
    user?: { id: string };
}

describe('ProfileRouter', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        // Mock do middleware de autenticação
        mockedRequireAuth.mockImplementation((req: AuthenticatedRequest, res, next) => {
            req.user = { id: 'user-123' };
            next();
        });

        // Mock dos controladores
        mockedProfileController.listProfiles.mockImplementation((req, res) => {
            res.status(200).json({ profiles: [] });
        });
        
        mockedProfileController.searchProfiles.mockImplementation((req, res) => {
            res.status(200).json({ profiles: [] });
        });
        
        mockedProfileController.getSimilarProfiles.mockImplementation((req, res) => {
            res.status(200).json({ profiles: [] });
        });
        
        mockedProfileController.getProfile.mockImplementation((req, res) => {
            res.status(200).json({ profile: {} });
        });
        
        mockedProfileController.toggleLikeProfile.mockImplementation((req, res) => {
            res.status(200).json({ liked: true });
        });
        
        mockedProfileController.toggleFollowProfile.mockImplementation((req, res) => {
            res.status(200).json({ followed: true });
        });

        app.use('/profiles', ProfileRouter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        it('should call listProfiles controller', async () => {
            // When
            const response = await request(app)
                .get('/profiles')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.listProfiles).toHaveBeenCalled();
            expect(response.body).toEqual({ profiles: [] });
        });
    });

    describe('GET /search', () => {
        it('should call searchProfiles controller', async () => {
            // When
            const response = await request(app)
                .get('/profiles/search?q=test')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.searchProfiles).toHaveBeenCalled();
            expect(response.body).toEqual({ profiles: [] });
        });
    });

    describe('GET /:userId/similar', () => {
        it('should call getSimilarProfiles controller', async () => {
            // When
            const response = await request(app)
                .get('/profiles/user-123/similar')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.getSimilarProfiles).toHaveBeenCalled();
            expect(response.body).toEqual({ profiles: [] });
        });
    });

    describe('GET /:username', () => {
        it('should call getProfile controller', async () => {
            // When
            const response = await request(app)
                .get('/profiles/testuser')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.getProfile).toHaveBeenCalled();
            expect(response.body).toEqual({ profile: {} });
        });
    });

    describe('POST /:username/like', () => {
        it('should call toggleLikeProfile controller', async () => {
            // When
            const response = await request(app)
                .post('/profiles/testuser/like')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.toggleLikeProfile).toHaveBeenCalled();
            expect(response.body).toEqual({ liked: true });
        });
    });

    describe('POST /:username/follow', () => {
        it('should call toggleFollowProfile controller', async () => {
            // When
            const response = await request(app)
                .post('/profiles/testuser/follow')
                .expect(200);

            // Then
            expect(mockedRequireAuth).toHaveBeenCalled();
            expect(mockedProfileController.toggleFollowProfile).toHaveBeenCalled();
            expect(response.body).toEqual({ followed: true });
        });
    });

    describe('Authentication middleware', () => {
        it('should require authentication for all routes', async () => {
            // Given
            mockedRequireAuth.mockImplementation((req: AuthenticatedRequest, res, next) => {
                res.status(401).json({ error: 'Unauthorized' });
            });

            // When & Then
            await request(app)
                .get('/profiles')
                .expect(401);

            await request(app)
                .get('/profiles/search')
                .expect(401);

            await request(app)
                .get('/profiles/user-123/similar')
                .expect(401);

            await request(app)
                .get('/profiles/testuser')
                .expect(401);

            await request(app)
                .post('/profiles/testuser/like')
                .expect(401);

            await request(app)
                .post('/profiles/testuser/follow')
                .expect(401);

            // Verify that requireAuth was called for each route
            expect(mockedRequireAuth).toHaveBeenCalledTimes(6);
        });
    });
});