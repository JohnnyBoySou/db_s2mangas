import axios from 'axios';
import FormData from 'form-data';
import { summarizeHandler } from '../handlers/SummaryHandlers';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock das variáveis de ambiente
const originalEnv = process.env;

describe('Summary Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            TESSERACT_SERVICE_URL: 'http://localhost:3001',
            REQUEST_TIMEOUT_MS: '180000'
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('summarizeHandler', () => {
        it('deve ser uma função', () => {
            expect(typeof summarizeHandler).toBe('function');
        });

        it('deve lançar erro quando TESSERACT_SERVICE_URL não estiver configurada', async () => {
            delete process.env.TESSERACT_SERVICE_URL;

            await expect(summarizeHandler({ files: [], imageUrls: [] }))
                .rejects
                .toThrow('TESSERACT_SERVICE_URL não configurada no Railway');
        });

        it('deve processar arquivos com sucesso', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            const files = [{
                buffer: Buffer.from('fake image data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            }];
            
            const mockResponse = { data: { summary: 'Arquivo processado' } };
            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await summarizeHandler({ files, imageUrls: [] });
            
            expect(result).toEqual({ summary: 'Arquivo processado' });
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:3001/summarize',
                expect.any(FormData),
                expect.objectContaining({
                    headers: expect.any(Object),
                    timeout: 180000
                })
            );
        });

        it('deve processar URLs de imagem com sucesso', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
            
            const mockResponse = { data: { summary: 'URLs processadas' } };
            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await summarizeHandler({ files: [], imageUrls });
            
            expect(result).toEqual({ summary: 'URLs processadas' });
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:3001/summarize',
                { image_urls: imageUrls },
                { timeout: 180000 }
            );
        });

        it('deve lançar erro quando nem arquivos nem URLs são fornecidos', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            await expect(summarizeHandler({ files: [], imageUrls: [] }))
                .rejects
                .toThrow("Envie 'pages' (arquivos) ou 'image_urls' (array).");
        });

        it('deve tratar erro de conexão recusada', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            const files = [{
                buffer: Buffer.from('fake image data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            }];
            
            const error = Object.assign(new Error('Connection refused'), { code: 'ECONNREFUSED' });
            mockedAxios.post.mockRejectedValueOnce(error);

            await expect(summarizeHandler({ files, imageUrls: [] }))
                .rejects
                .toThrow('Serviço Tesseract não está disponível em http://localhost:3001');
        });

        it('deve tratar erro de resposta do serviço', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            const files = [{
                buffer: Buffer.from('fake image data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            }];
            
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Formato de arquivo inválido' }
                }
            };
            mockedAxios.post.mockRejectedValueOnce(error);

            await expect(summarizeHandler({ files, imageUrls: [] }))
                .rejects
                .toThrow('Erro do serviço Tesseract: Formato de arquivo inválido');
        });

        it('deve tratar erro genérico de conexão', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            
            const files = [{
                buffer: Buffer.from('fake image data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            }];
            
            const error = new Error('Network error');
            mockedAxios.post.mockRejectedValueOnce(error);

            await expect(summarizeHandler({ files, imageUrls: [] }))
                .rejects
                .toThrow('Erro ao conectar com serviço Tesseract: Network error');
        });

        it('deve usar timeout padrão quando REQUEST_TIMEOUT_MS não estiver definido', async () => {
            process.env.TESSERACT_SERVICE_URL = 'http://localhost:3001';
            delete process.env.REQUEST_TIMEOUT_MS;
            
            const imageUrls = ['https://example.com/image.jpg'];
            const mockResponse = { data: { summary: 'Processado' } };
            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            await summarizeHandler({ files: [], imageUrls });
            
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:3001/summarize',
                { image_urls: imageUrls },
                { timeout: 180000 }
            );
        });
    });
});