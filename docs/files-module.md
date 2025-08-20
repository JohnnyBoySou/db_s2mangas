# Módulo Files

## Visão Geral

O módulo **Files** é responsável pelo sistema de gestão de arquivos da plataforma S2Mangas. Ele gerencia upload, armazenamento, consulta e exclusão de arquivos, com foco principal em imagens. O sistema suporta upload via base64, validação de tipos de arquivo, controle de tamanho e limpeza automática de arquivos órfãos.

## Estrutura de Diretórios

```
src/modules/files/
├── controllers/
│   └── FilesController.ts    # Controllers HTTP
├── handlers/
│   └── FilesHandler.ts       # Lógica de negócio
├── routes/
│   └── FilesRouter.ts        # Configuração de rotas
└── validators/
    └── FilesValidator.ts     # Validação de dados
```

## Funcionalidades Principais

### 1. Upload de Arquivos
- **Upload via Base64**: Recebimento de arquivos codificados em base64
- **Validação de tipo**: Suporte apenas para imagens (JPEG, PNG, GIF, WebP)
- **Controle de tamanho**: Limite máximo de 5MB por arquivo
- **Geração de UUID**: Identificadores únicos para cada arquivo
- **Armazenamento físico**: Salvamento em diretório configurável

### 2. Gestão de Arquivos
- **Consulta por ID**: Busca de informações de arquivos específicos
- **Exclusão segura**: Remoção tanto do banco quanto do sistema de arquivos
- **URLs públicas**: Geração de URLs acessíveis para os arquivos
- **Metadados completos**: Armazenamento de informações detalhadas

### 3. Limpeza e Manutenção
- **Arquivos órfãos**: Identificação e remoção de arquivos sem registro no banco
- **Limpeza automática**: Funcionalidade administrativa para manutenção
- **Logs de auditoria**: Rastreamento de operações de limpeza

## Endpoints da API

### POST /files/upload
**Descrição**: Faz upload de um arquivo em formato base64

**Autenticação**: Requerida

**Body**:
```json
{
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "filename": "imagem.jpg",
  "mimetype": "image/jpeg"
}
```

**Resposta (201)**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "imagem.jpg",
  "url": "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg",
  "mimetype": "image/jpeg",
  "size": 1024000,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /files/{id}
**Descrição**: Obtém informações de um arquivo específico

**Autenticação**: Requerida

**Parâmetros**:
- `id` (path): ID único do arquivo (UUID)

**Resposta (200)**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "imagem.jpg",
  "path": "/app/uploads/123e4567-e89b-12d3-a456-426614174000.jpg",
  "url": "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg",
  "mimetype": "image/jpeg",
  "size": 1024000,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /files/{id}
**Descrição**: Remove um arquivo do servidor e do banco de dados

**Autenticação**: Requerida

**Parâmetros**:
- `id` (path): ID único do arquivo (UUID)

**Resposta (204)**: Sem conteúdo (arquivo deletado com sucesso)

### POST /files/cleanup (Admin)
**Descrição**: Remove arquivos físicos órfãos (sem registro no banco)

**Autenticação**: Requerida (Admin)

**Resposta (200)**:
```json
{
  "message": "Limpeza de arquivos órfãos concluída com sucesso"
}
```

## Schemas de Dados

### File
```typescript
interface File {
  id: string;          // UUID único do arquivo
  filename: string;    // Nome original do arquivo
  path: string;        // Caminho físico no servidor
  url: string;         // URL pública de acesso
  mimetype: string;    // Tipo MIME do arquivo
  size: number;        // Tamanho em bytes
  createdAt: Date;     // Data de criação
  updatedAt: Date;     // Data da última atualização
}
```

### FileUpload (Input)
```typescript
interface FileUpload {
  base64: string;      // Conteúdo em base64 (obrigatório)
  filename: string;    // Nome do arquivo (obrigatório)
  mimetype: string;    // Tipo MIME (obrigatório)
}
```

### FileUploadResponse
```typescript
interface FileUploadResponse {
  id: string;          // UUID do arquivo criado
  filename: string;    // Nome original
  url: string;         // URL pública
  mimetype: string;    // Tipo MIME
  size: number;        // Tamanho em bytes
  createdAt: Date;     // Data de criação
}
```

## Configurações e Constantes

### Diretório de Upload
```typescript
const UPLOAD_DIR = 
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||  // Produção (Railway)
  process.env.UPLOAD_DIR ||                 // Configuração customizada
  path.join(process.cwd(), "data", "uploads"); // Padrão local
```

### Limitações
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
];
```

### URL Pública
```typescript
const publicBase = process.env.PUBLIC_BASE_URL || "";
const publicUrl = `${publicBase}/uploads/${filename}`;
```

## Validação de Dados

### Schema de Upload
```typescript
export const uploadFileSchema = z.object({
  base64: z.string().min(1, 'O arquivo base64 é obrigatório'),
  filename: z.string().min(1, 'O nome do arquivo é obrigatório'),
  mimetype: z.string().min(1, 'O tipo do arquivo é obrigatório')
});
```

### Validações de Negócio
1. **Tipo de arquivo**: Verificação contra lista de tipos permitidos
2. **Tamanho máximo**: Limite de 5MB por arquivo
3. **Formato base64**: Remoção de prefixos e validação
4. **Extensão de arquivo**: Preservação da extensão original

## Lógica de Negócio

### Processo de Upload
1. **Validação de entrada**: Verificação de dados obrigatórios
2. **Validação de tipo**: Checagem contra tipos permitidos
3. **Decodificação base64**: Conversão para buffer binário
4. **Validação de tamanho**: Verificação do limite máximo
5. **Geração de UUID**: Criação de identificador único
6. **Salvamento físico**: Escrita do arquivo no sistema
7. **Registro no banco**: Criação do registro com metadados
8. **Retorno de dados**: Informações do arquivo criado

### Processo de Exclusão
1. **Busca do arquivo**: Verificação de existência no banco
2. **Remoção física**: Exclusão do arquivo do sistema
3. **Remoção do banco**: Exclusão do registro
4. **Tratamento de erros**: Logs em caso de falha na remoção física

### Limpeza de Órfãos
1. **Listagem física**: Arquivos presentes no diretório
2. **Consulta do banco**: Registros de arquivos válidos
3. **Comparação**: Identificação de arquivos sem registro
4. **Remoção**: Exclusão de arquivos órfãos
5. **Auditoria**: Logs detalhados da operação

## Controladores HTTP

### FilesController
- **uploadFile**: Processa upload de arquivos via base64
- **getFileById**: Retorna informações de arquivo específico
- **deleteFile**: Remove arquivo do sistema e banco
- **cleanOrphanFilesEndpoint**: Executa limpeza de arquivos órfãos

## Configuração de Rotas

### Rotas de Usuário (Autenticadas)
- `POST /files/upload` → `uploadFile`
- `GET /files/:id` → `getFileById`
- `DELETE /files/:id` → `deleteFile`

### Rotas Administrativas
- `POST /files/cleanup` → `cleanOrphanFilesEndpoint` (Admin)

## Tratamento de Erros

### Tipos de Erro
1. **Validação de entrada**: Dados obrigatórios ausentes ou inválidos
2. **Tipo não permitido**: Arquivo de tipo não suportado
3. **Arquivo muito grande**: Excede o limite de 5MB
4. **Arquivo não encontrado**: ID inválido ou arquivo inexistente
5. **Erro de sistema**: Falhas de I/O ou banco de dados

### Códigos de Status
- `201`: Arquivo criado com sucesso
- `200`: Operação realizada com sucesso
- `204`: Arquivo deletado com sucesso
- `400`: Dados de entrada inválidos
- `401`: Usuário não autenticado
- `403`: Acesso negado (admin necessário)
- `404`: Arquivo não encontrado
- `413`: Arquivo muito grande
- `500`: Erro interno do servidor

## Dependências

### Principais
- **@prisma/client**: ORM para interação com banco de dados
- **express**: Framework web para rotas HTTP
- **uuid**: Geração de identificadores únicos
- **fs**: Sistema de arquivos Node.js
- **path**: Manipulação de caminhos de arquivo

### Validação
- **zod**: Validação de schemas de entrada
- **@/utils/zodError**: Tratamento de erros de validação

### Utilitários
- **@/utils/cleanOrphanFiles**: Limpeza de arquivos órfãos
- **@/middlewares/auth**: Autenticação e autorização

## Segurança

### Autenticação
- **JWT Token**: Todas as rotas protegidas por autenticação
- **Autorização Admin**: Rotas administrativas requerem privilégios especiais

### Validação de Arquivos
- **Whitelist de tipos**: Apenas tipos de imagem permitidos
- **Limite de tamanho**: Proteção contra uploads excessivos
- **Sanitização de nomes**: Uso de UUIDs para evitar conflitos
- **Validação de base64**: Verificação de formato correto

### Proteção de Dados
- **Isolamento de diretórios**: Arquivos armazenados em local específico
- **URLs controladas**: Acesso via URLs públicas configuráveis
- **Logs de auditoria**: Rastreamento de operações críticas

## Integração com Outros Módulos

### Módulo Auth
- **Autenticação**: Verificação de usuários autenticados
- **Autorização**: Controle de acesso administrativo

### Módulo Users
- **Avatares**: Upload de imagens de perfil
- **Associação**: Vinculação de arquivos a usuários

### Módulos de Conteúdo
- **Manga**: Capas e imagens relacionadas
- **Comments**: Anexos em comentários
- **Wallpapers**: Imagens de fundo personalizadas

## Considerações de Performance

### Otimizações Atuais
- **Validação prévia**: Verificações antes de operações custosas
- **Streams de arquivo**: Uso eficiente de memória para arquivos grandes
- **UUIDs únicos**: Evita conflitos e facilita distribuição
- **Diretórios configuráveis**: Flexibilidade para diferentes ambientes

### Limitações
- **Sem compressão**: Arquivos armazenados no formato original
- **Sem redimensionamento**: Imagens mantêm tamanho original
- **Sem CDN**: Servimento direto pelo servidor
- **Sem cache**: Cada acesso vai ao sistema de arquivos

### Estratégias de Melhoria
- **Compressão automática**: Otimização de imagens no upload
- **Múltiplas resoluções**: Geração de thumbnails e versões otimizadas
- **CDN integration**: Distribuição via rede de entrega de conteúdo
- **Cache inteligente**: Cache de arquivos frequentemente acessados

## Próximas Melhorias

### Funcionalidades
1. **Processamento de imagens**: Redimensionamento e otimização automática
2. **Múltiplos formatos**: Conversão automática para formatos otimizados
3. **Thumbnails**: Geração automática de miniaturas
4. **Metadados EXIF**: Extração e armazenamento de informações da imagem
5. **Galeria de arquivos**: Interface para navegação de arquivos do usuário
6. **Compartilhamento**: URLs temporárias e controle de acesso

### Técnicas
1. **CDN integration**: Integração com serviços de distribuição
2. **Cloud storage**: Suporte a AWS S3, Google Cloud Storage
3. **Compressão inteligente**: Otimização baseada no tipo de conteúdo
4. **Cache distribuído**: Cache de arquivos em múltiplas camadas
5. **Upload progressivo**: Suporte a uploads de arquivos grandes
6. **Processamento assíncrono**: Queue para operações pesadas

### Segurança
1. **Análise de malware**: Verificação de segurança em uploads
2. **Watermarking**: Marca d'água automática em imagens
3. **Controle de acesso granular**: Permissões por arquivo
4. **Auditoria completa**: Logs detalhados de todas as operações
5. **Backup automático**: Redundância de arquivos críticos

## Testes

### Cenários de Teste
- **Upload válido**: Arquivos dentro dos limites e tipos permitidos
- **Validação de tipo**: Rejeição de tipos não permitidos
- **Limite de tamanho**: Rejeição de arquivos muito grandes
- **Consulta de arquivos**: Busca por ID válido e inválido
- **Exclusão**: Remoção de arquivos existentes e inexistentes
- **Limpeza de órfãos**: Identificação e remoção de arquivos órfãos

### Testes de Integração
- **Fluxo completo**: Upload, consulta e exclusão
- **Autenticação**: Verificação de proteção de rotas
- **Autorização**: Controle de acesso administrativo
- **Persistência**: Verificação de dados no banco e sistema de arquivos

### Cobertura
- **Controllers**: Todos os endpoints testados
- **Handlers**: Lógica de negócio validada
- **Validadores**: Schemas de entrada verificados
- **Cenários de erro**: Tratamento de exceções testado

## Documentação Swagger

O módulo possui documentação completa no Swagger com:
- **Schemas detalhados**: Definição de todos os tipos de dados
- **Endpoints documentados**: Todas as rotas com exemplos
- **Códigos de resposta**: Documentação de possíveis retornos
- **Exemplos práticos**: Casos de uso reais

Acesse a documentação em: `/api-docs#/Arquivos`