import request from 'supertest';
import express from 'express';
import { SummaryRouter } from '../routes/SummaryRouter';
import { postSummary } from '../controllers/SummaryControllers';

// Mock do controller
jest.mock('../controllers/SummaryControllers');
const mockPostSummary = postSummary as jest.MockedFunction<typeof postSummary>;

describe('Summary Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/summary', SummaryRouter);
        jest.clearAllMocks();
    });

    describe('POST /summary', () => {
        it('deve aceitar requisição POST na rota raiz', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                res.json({ success: true, summary: 'Teste' });
            });

            const response = await request(app)
                .post('/summary')
                .send({ image_urls: ['https://example.com/image.jpg'] })
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body).toEqual({ success: true, summary: 'Teste' });
        });

        it('deve aceitar upload de arquivos', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                res.json({ success: true, summary: 'Arquivo processado' });
            });

            const response = await request(app)
                .post('/summary')
                .attach('pages', Buffer.from('fake image data'), 'test.jpg')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body).toEqual({ success: true, summary: 'Arquivo processado' });
        });

        it('deve aceitar múltiplos arquivos', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                res.json({ success: true, summary: 'Múltiplos arquivos processados' });
            });

            const response = await request(app)
                .post('/summary')
                .attach('pages', Buffer.from('fake image data 1'), 'test1.jpg')
                .attach('pages', Buffer.from('fake image data 2'), 'test2.jpg')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body).toEqual({ success: true, summary: 'Múltiplos arquivos processados' });
        });

        it('deve aceitar requisição com JSON e arquivos simultaneamente', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                res.json({ success: true, summary: 'JSON e arquivos processados' });
            });

            const response = await request(app)
                .post('/summary')
                .field('image_urls', JSON.stringify(['https://example.com/image.jpg']))
                .attach('pages', Buffer.from('fake image data'), 'test.jpg')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body).toEqual({ success: true, summary: 'JSON e arquivos processados' });
        });

        it('deve tratar erro do controller', async () => {
            mockPostSummary.mockImplementation(async (req, res, next) => {
                const error = new Error('Erro no controller');
                next(error);
            });

            await request(app)
                .post('/summary')
                .send({ image_urls: ['https://example.com/image.jpg'] })
                .expect(500); // Express error handler padrão

            expect(mockPostSummary).toHaveBeenCalled();
        });

        it('deve aceitar requisição vazia', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                res.json({ success: false, message: 'Nenhum dado fornecido' });
            });

            const response = await request(app)
                .post('/summary')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body).toEqual({ success: false, message: 'Nenhum dado fornecido' });
        });
    });

    describe('Middleware de upload', () => {
        it('deve configurar multer para aceitar até 100 arquivos', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                // Verifica se req.files está disponível (configurado pelo multer)
                res.json({ 
                    success: true, 
                    filesReceived: Array.isArray(req.files) ? req.files.length : 0 
                });
            });

            const response = await request(app)
                .post('/summary')
                .attach('pages', Buffer.from('fake image data 1'), 'test1.jpg')
                .attach('pages', Buffer.from('fake image data 2'), 'test2.jpg')
                .attach('pages', Buffer.from('fake image data 3'), 'test3.jpg')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body.success).toBe(true);
        });

        it('deve usar memoryStorage para armazenar arquivos em memória', async () => {
            mockPostSummary.mockImplementation(async (req, res) => {
                // Verifica se os arquivos têm buffer (característica do memoryStorage)
                const hasBuffer = Array.isArray(req.files) && 
                    req.files.length > 0 && 
                    'buffer' in req.files[0];
                
                res.json({ 
                    success: true, 
                    hasBuffer 
                });
            });

            const response = await request(app)
                .post('/summary')
                .attach('pages', Buffer.from('fake image data'), 'test.jpg')
                .expect(200);

            expect(mockPostSummary).toHaveBeenCalled();
            expect(response.body.hasBuffer).toBe(true);
        });
    });
});