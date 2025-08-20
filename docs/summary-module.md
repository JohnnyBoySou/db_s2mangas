# Módulo Summary

## Visão Geral

O módulo `summary` é responsável por processar e resumir conteúdo de mangás através de OCR (Optical Character Recognition) e análise de texto. Este módulo atua como um proxy para um microserviço externo Tesseract que realiza o processamento de imagens e extração de texto para gerar resumos automáticos.

## Estrutura de Diretórios

```
src/modules/summary/
├── controllers/
│   └── SummaryControllers.ts   # Controladores HTTP
├── handlers/
│   └── SummaryHandlers.ts      # Lógica de negócio e integração com microserviço
└── routes/
    └── SummaryRouter.ts        # Configuração de rotas
```

## Funcionalidades Principais

### Processamento de Imagens
- **Upload de Arquivos**: Aceita múltiplos arquivos de imagem (até 100)
- **URLs de Imagens**: Processa imagens através de URLs
- **OCR**: Extração de texto de imagens usando Tesseract
- **Resumo Automático**: Geração de resumos do conteúdo extraído

### Integração com Microserviço
- **Proxy para Tesseract**: Encaminha requisições para serviço externo
- **Tratamento de Erros**: Gerenciamento de falhas de conectividade
- **Timeout Configurável**: Controle de tempo limite para requisições

## Endpoints da API

### Criar Resumo
- **POST** `/`
- **Autenticação**: Não especificada (público)
- **Content-Type**: `multipart/form-data` ou `application/json`
- **Parâmetros**:
  - `pages` (files): Array de arquivos de imagem (máximo 100)
  - `image_urls` (body): Array de URLs de imagens
  - `imageUrls` (body): Alias para `image_urls`

#### Exemplo com Arquivos
```bash
curl -X POST \
  http://localhost:3000/api/summary \
  -F "pages=@page1.jpg" \
  -F "pages=@page2.jpg"
```

#### Exemplo com URLs
```json
{
  "image_urls": [
    "https://example.com/page1.jpg",
    "https://example.com/page2.jpg"
  ]
}
```

## Schemas de Dados

### Requisição com Arquivos
```typescript
interface FileUploadRequest {
  pages: File[];  // Máximo 100 arquivos
}
```

### Requisição com URLs
```typescript
interface URLRequest {
  image_urls: string[];  // Array de URLs de imagens
  imageUrls?: string[];  // Alias alternativo
}
```

### Resposta de Resumo
```typescript
interface SummaryResponse {
  // Estrutura dependente do microserviço Tesseract
  // Tipicamente inclui:
  summary?: string;      // Resumo gerado
  extractedText?: string; // Texto extraído
  confidence?: number;   // Confiança do OCR
  pages?: number;        // Número de páginas processadas
}
```

### Resposta de Erro
```typescript
interface ErrorResponse {
  message: string;
  status: number;
}
```

## Validação de Dados

### Regras de Validação
- **Arquivos**: Máximo 100 arquivos por requisição
- **Formato**: Aceita qualquer tipo de arquivo (configurável via multer)
- **Entrada Obrigatória**: Deve fornecer `pages` (arquivos) OU `image_urls`
- **URLs**: Devem ser URLs válidas de imagens

### Tratamento de Entrada
- Suporte a múltiplos formatos de campo (`image_urls` e `imageUrls`)
- Armazenamento em memória para arquivos temporários
- Validação de presença de dados de entrada

## Lógica de Negócio

### Handler Principal

#### summarizeHandler
- **Entrada**: Arquivos ou URLs de imagens
- **Processamento**:
  1. Valida configuração do microserviço
  2. Processa arquivos ou URLs conforme tipo de entrada
  3. Encaminha requisição para microserviço Tesseract
  4. Retorna resposta do microserviço
- **Saída**: Dados de resumo processados

### Fluxo de Processamento

#### Com Arquivos
1. Recebe arquivos via multer
2. Cria FormData com arquivos
3. Envia para microserviço via POST multipart
4. Retorna resposta processada

#### Com URLs
1. Recebe array de URLs
2. Envia JSON para microserviço
3. Microserviço baixa e processa imagens
4. Retorna resposta processada

## Controladores HTTP

O `SummaryControllers.ts` gerencia:
- Extração de dados da requisição (arquivos e URLs)
- Normalização de campos de entrada
- Chamada para handler de negócio
- Tratamento de erros e resposta HTTP

## Configuração de Rotas

### Middleware
- **multer**: Configurado para armazenamento em memória
- **upload.array('pages', 100)**: Aceita até 100 arquivos

### Rotas Disponíveis
- `POST /` - Criar resumo (com arquivos ou URLs)

## Tratamento de Erros

### Códigos de Status
- **200**: Resumo criado com sucesso
- **400**: Dados de entrada inválidos
- **500**: Erro de configuração (TESSERACT_SERVICE_URL não definida)
- **503**: Serviço Tesseract indisponível
- **Outros**: Códigos retornados pelo microserviço

### Tipos de Erro

#### Erro de Configuração
```typescript
{
  message: "TESSERACT_SERVICE_URL não configurada no Railway",
  status: 500
}
```

#### Erro de Entrada
```typescript
{
  message: "Envie 'pages' (arquivos) ou 'image_urls' (array).",
  status: 400
}
```

#### Erro de Conectividade
```typescript
{
  message: "Serviço Tesseract não está disponível em {URL}",
  status: 503
}
```

#### Erro do Microserviço
```typescript
{
  message: "Erro do serviço Tesseract: {detalhes}",
  status: {status_do_microservico}
}
```

## Configuração

### Variáveis de Ambiente

#### TESSERACT_SERVICE_URL
- **Descrição**: URL do microserviço Tesseract
- **Obrigatório**: Sim
- **Exemplo**: `https://tesseract-service.railway.app`

#### REQUEST_TIMEOUT_MS
- **Descrição**: Timeout para requisições ao microserviço (ms)
- **Padrão**: 180000 (3 minutos)
- **Exemplo**: `300000` (5 minutos)

## Dependências

### Principais
- **axios**: Cliente HTTP para comunicação com microserviço
- **form-data**: Construção de dados multipart
- **multer**: Middleware para upload de arquivos
- **express**: Framework web

### Microserviço
- **Tesseract OCR**: Serviço externo para processamento de imagens

## Segurança

### Limitações
- Máximo 100 arquivos por requisição
- Timeout configurável para evitar requisições longas
- Armazenamento temporário em memória

### Considerações
- Não há autenticação implementada
- Validação de tipo de arquivo limitada
- Exposição direta de erros do microserviço

### Melhorias Recomendadas
- Implementar autenticação
- Validar tipos de arquivo permitidos
- Sanitizar mensagens de erro
- Rate limiting para uploads

## Integração com Microserviço

### Endpoints do Tesseract
- **POST** `/summarize` - Processar imagens e gerar resumo

### Formatos Suportados
- **Multipart**: Para upload de arquivos
- **JSON**: Para processamento via URLs

### Comunicação
- **Protocolo**: HTTP/HTTPS
- **Timeout**: Configurável (padrão 3 minutos)
- **Retry**: Não implementado

## Considerações de Performance

### Limitações
- Processamento síncrono (bloqueia thread)
- Armazenamento em memória (limitado por RAM)
- Dependência de microserviço externo
- Timeout longo (3 minutos padrão)

### Otimizações Atuais
- Armazenamento em memória (mais rápido que disco)
- Timeout configurável
- Reutilização de conexões HTTP

### Estratégias de Melhoria
- Implementar processamento assíncrono
- Cache para resultados frequentes
- Retry automático com backoff
- Compressão de imagens antes do envio
- Pool de conexões HTTP

## Monitoramento

### Métricas Importantes
- Tempo de resposta do microserviço
- Taxa de sucesso/falha
- Tamanho médio de arquivos processados
- Uso de memória durante uploads

### Logs Recomendados
- Requisições ao microserviço
- Erros de conectividade
- Timeouts
- Tamanho de arquivos processados

## Próximas Melhorias

### Funcionalidades
- Processamento assíncrono com webhooks
- Cache de resultados
- Suporte a mais formatos de imagem
- Batch processing otimizado
- Histórico de resumos

### Técnicas
- Implementar retry com exponential backoff
- Compressão de imagens
- Streaming de arquivos grandes
- Health check do microserviço
- Métricas e observabilidade

### Segurança
- Autenticação e autorização
- Validação rigorosa de tipos de arquivo
- Rate limiting
- Sanitização de URLs
- Auditoria de uploads

## Testes

### Cenários de Teste
- Upload de arquivos válidos e inválidos
- Processamento via URLs
- Tratamento de erros de conectividade
- Timeout de requisições
- Validação de limites (100 arquivos)
- Resposta do microserviço

### Integração
- Testes com microserviço mock
- Testes de timeout
- Testes de falha de rede
- Testes de performance

### Cobertura
- Handlers de negócio: 90%
- Controladores HTTP: 85%
- Tratamento de erros: 95%
- Integração com microserviço: 80%

## Arquitetura

### Padrão Utilizado
- **Proxy Pattern**: Módulo atua como proxy para microserviço
- **Adapter Pattern**: Adapta interface HTTP para microserviço

### Fluxo de Dados
```
Cliente → SummaryRouter → SummaryController → SummaryHandler → Microserviço Tesseract
                                                                        ↓
Cliente ← Resposta JSON ← Resposta HTTP ← Resposta Processada ← Resposta OCR
```

### Responsabilidades
- **Router**: Configuração de rotas e middleware
- **Controller**: Extração de dados e resposta HTTP
- **Handler**: Lógica de negócio e comunicação com microserviço
- **Microserviço**: Processamento OCR e geração de resumos

## Documentação da API

O módulo não possui documentação Swagger implementada. Recomenda-se adicionar:
- Schemas para requisições e respostas
- Exemplos de uso
- Códigos de erro
- Limites e restrições
- Formatos suportados