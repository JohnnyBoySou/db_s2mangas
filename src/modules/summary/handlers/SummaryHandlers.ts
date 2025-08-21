import axios from 'axios';
import FormData from 'form-data';

export async function summarizeHandler({ files = [], imageUrls = [] }: { files: any[], imageUrls: string[] }) {
  // Configuração da URL do microserviço Tesseract (configurada pelo Railway)
  const TESSERACT_URL = process.env.TESSERACT_SERVICE_URL;
  const REQ_TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS || 180000);
  
  if (!TESSERACT_URL) {
    throw Object.assign(new Error('TESSERACT_SERVICE_URL não configurada no Railway'), { status: 500 });
  }

  try {
    if (Array.isArray(files) && files.length) {
      const form = new FormData();
      for (const f of files) {
        form.append('pages', f.buffer, {  
          filename: f.originalname || 'upload.jpg',
          contentType: f.mimetype || 'application/octet-stream',
        });
      }
      
      const { data } = await axios.post(`${TESSERACT_URL}/summarize`, form, {
        headers: form.getHeaders(),
        timeout: REQ_TIMEOUT,
      });
      return data;
    }

    if (Array.isArray(imageUrls) && imageUrls.length) {
      const { data } = await axios.post(`${TESSERACT_URL}/summarize`, { image_urls: imageUrls }, {
        timeout: REQ_TIMEOUT,
      });
      return data;
    }

    throw Object.assign(new Error("Envie 'pages' (arquivos) ou 'image_urls' (array)."), { status: 400 });
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw Object.assign(new Error(`Serviço Tesseract não está disponível em ${TESSERACT_URL}`), { status: 503 });
    }
    if (error.response) {
      throw Object.assign(new Error(`Erro do serviço Tesseract: ${error.response.data?.message || error.message}`), { status: error.response.status });
    }
    throw Object.assign(new Error(`Erro ao conectar com serviço Tesseract: ${error.message}`), { status: 500 });
  }
}
