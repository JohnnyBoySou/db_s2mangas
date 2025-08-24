# Guia de Troubleshooting - S2Mangas Backend

## Problema: SIGTERM Error no Railway

### Sintomas
```
npm error path /usr/src/app
npm error command failed
npm error signal SIGTERM
npm error command sh -c node dist/server.js
```

### Causas Possíveis

1. **Timeout na inicialização** - A aplicação demora muito para inicializar
2. **Problemas de memória** - O processo consome muita memória
3. **Dependências não instaladas** - Problemas no build
4. **Configuração incorreta** - Variáveis de ambiente ou configurações

### Soluções Implementadas

#### 1. Script de Inicialização Robusto
- Criado `start.js` como wrapper para o servidor
- Adicionado tratamento de sinais (SIGTERM, SIGINT)
- Verificações de arquivos antes da inicialização

#### 2. Melhorias no Server.ts
- Tratamento de erros não capturados
- Graceful shutdown
- Inicialização assíncrona de serviços
- Logs mais detalhados

#### 3. Script de Build Melhorado
- Verificações de build
- Instalação de dependências mais robusta
- Verificação de arquivos essenciais

#### 4. Health Check Melhorado
- Informações de memória
- Status mais detalhado
- Timeout aumentado para 30s

### Como Usar

#### 1. Diagnóstico Local
```bash
npm run diagnose:deployment
```

#### 2. Build Local
```bash
npm run build
npm start
```

#### 3. Verificação de Saúde
```bash
curl http://localhost:3000/health
```

### Configurações do Railway

#### Variáveis de Ambiente Necessárias
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `REDIS_URL` (opcional)
- `ELASTIC_URL` (opcional)

#### Configurações de Deploy
- Health check timeout: 30s
- Restart policy: ON_FAILURE
- Max retries: 5

### Logs e Debugging

#### Verificar Logs
```bash
npm run logs
```

#### Logs do Railway
- Acesse o dashboard do Railway
- Vá para a aba "Deployments"
- Clique no deployment mais recente
- Verifique os logs de build e runtime

### Comandos Úteis

```bash
# Build e teste local
npm run build
npm start

# Diagnóstico
npm run diagnose:deployment

# Verificar saúde
curl http://localhost:3000/health

# Logs em tempo real
npm run logs
```

### Troubleshooting Específico

#### Se o build falhar:
1. Verifique se todas as dependências estão instaladas
2. Execute `npm run diagnose:deployment`
3. Verifique os logs do Railway

#### Se a aplicação não iniciar:
1. Verifique se `dist/server.js` existe
2. Execute `npm run start:direct` para bypass do wrapper
3. Verifique as variáveis de ambiente

#### Se houver problemas de memória:
1. Monitore o uso de memória com `/health`
2. Considere aumentar os recursos no Railway
3. Otimize o código para usar menos memória

### Contato
Se o problema persistir, verifique:
1. Logs completos do Railway
2. Output do comando de diagnóstico
3. Status do health check
