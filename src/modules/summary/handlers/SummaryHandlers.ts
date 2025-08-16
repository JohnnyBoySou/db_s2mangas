import axios from 'axios';
import FormData from 'form-data';

const INTERNAL_API_URL = (process.env.INTERNAL_API_URL || '').replace(/\/$/, '');
const REQ_TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS || 180000);

export async function summarizeHandler({ files = [], imageUrls = [] }: { files: any[], imageUrls: string[] }) {
  if (!INTERNAL_API_URL) throw Object.assign(new Error('INTERNAL_API_URL não configurada'), { status: 500 });

  if (Array.isArray(files) && files.length) {
    const form = new FormData();
    for (const f of files) {
      form.append('pages', f.buffer, {  
        filename: f.originalname || 'upload.jpg',
        contentType: f.mimetype || 'application/octet-stream',
      });
    }
    const { data } = await axios.post(`${INTERNAL_API_URL}/summarize`, form, {
      headers: form.getHeaders(),
      timeout: REQ_TIMEOUT,
    });
    return data;
  }

  if (Array.isArray(imageUrls) && imageUrls.length) {
    const { data } = await axios.post(`${INTERNAL_API_URL}/summarize`, { image_urls: imageUrls }, {
      timeout: REQ_TIMEOUT,
    });
    return data;
  }

  throw Object.assign(new Error("Envie 'pages' (arquivos) ou 'image_urls' (array)."), { status: 400 });
}
