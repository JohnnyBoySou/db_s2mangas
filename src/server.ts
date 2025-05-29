import express from 'express'
import cors from 'cors'
import authRouter from '@/routes/auth/index'
import mangaRouter from '@/routes/manga/index';
import collectionRouter from '@/routes/collection';
import discoverRouter from '@/routes/discover';
import libraryRouter from '@/routes/library';
import searchRouter from '@/routes/search';
import commentRouter from '@/routes/comment';
import chaptersRouter from '@/routes/chapters';
import notificationsRouter from '@/routes/notifications';
import wallpaperRouter from '@/routes/wallpapers';

const app = express()
app.use(express.json())

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use('/auth', authRouter)
app.use('/manga/', mangaRouter)
app.use('/collection', collectionRouter)
app.use('/discover', discoverRouter)
app.use('/library', libraryRouter)
app.use('/search', searchRouter)
app.use('/comment', commentRouter)
app.use('/chapter', chaptersRouter)
app.use('/notifications', notificationsRouter)
app.use('/wallpapers', wallpaperRouter)

// Configurar o proxy para a API do MangaDex
//app.use('/api/mangadex', mangaDexProxy);

app.listen(3000, () => {
  console.log('✅ Servidor inciado com sucesso! \n✅ Rodando em http://localhost:3000')
})

export default app;
