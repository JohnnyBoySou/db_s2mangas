# Módulo Coins

## Visão Geral

O módulo **Coins** é responsável pelo sistema de moedas virtuais da plataforma S2Mangas. Ele gerencia o saldo de coins dos usuários, permitindo adicionar, remover, transferir e consultar o saldo de moedas virtuais. Este sistema é fundamental para funcionalidades premium, compras in-app e recompensas.

## Estrutura de Diretórios

```
src/modules/coins/
├── __tests__/
│   ├── controller.test.ts    # Testes dos controllers
│   └── handler.test.ts       # Testes dos handlers
├── controllers/
│   └── CoinsController.ts    # Controllers HTTP
├── handlers/
│   └── CoinsHandler.ts       # Lógica de negócio
└── routes/
    └── CoinsRouter.ts        # Configuração de rotas
```

## Funcionalidades Principais

### 1. Gestão de Saldo
- **Consulta de saldo**: Visualização do saldo atual de coins do usuário
- **Adição de coins**: Incremento do saldo (recompensas, compras)
- **Remoção de coins**: Decremento do saldo (gastos, penalidades)
- **Validação de saldo**: Verificação de saldo suficiente antes de operações

### 2. Transferências
- **Transferência entre usuários**: Movimentação de coins entre contas
- **Transações atômicas**: Garantia de consistência nas transferências
- **Validação de usuários**: Verificação da existência dos usuários envolvidos

### 3. Histórico (Preparado)
- **Rastreamento de transações**: Estrutura preparada para histórico de movimentações
- **Paginação**: Suporte a consultas paginadas do histórico

## Endpoints da API

### GET /coins
**Descrição**: Obtém o saldo atual de coins do usuário autenticado

**Autenticação**: Requerida

**Resposta**:
```json
{
  "id": "user-id",
  "coins": 150
}
```

### POST /coins/add
**Descrição**: Adiciona coins ao saldo do usuário

**Autenticação**: Requerida

**Body**:
```json
{
  "amount": 30  // Opcional, usa valor padrão se não informado
}
```

**Resposta**:
```json
{
  "id": "user-id",
  "coins": 180
}
```

### POST /coins/remove
**Descrição**: Remove coins do saldo do usuário

**Autenticação**: Requerida

**Body**:
```json
{
  "amount": 15  // Opcional, usa valor padrão se não informado
}
```

**Resposta**:
```json
{
  "id": "user-id",
  "coins": 165
}
```

## Schemas de Dados

### UserCoins
```typescript
interface UserCoins {
  id: string;      // ID do usuário
  coins: number;   // Quantidade de coins
}
```

### Error
```typescript
interface Error {
  message: string; // Mensagem de erro
}
```

## Lógica de Negócio

### Constantes do Sistema
```typescript
const COIN_AMOUNTS = {
  ADD: 30,     // Quantidade padrão para adicionar
  REMOVE: 15   // Quantidade padrão para remover
} as const;
```

### Validações
1. **Saldo Suficiente**: Verificação antes de remoção ou transferência
2. **Usuário Existente**: Validação da existência do usuário
3. **Valores Positivos**: Garantia de que apenas valores positivos sejam processados
4. **Limites de Transação**: Controle de valores mínimos e máximos

### Operações Atômicas
- **Transferências**: Uso de transações do Prisma para garantir consistência
- **Rollback Automático**: Reversão em caso de erro durante transferências
- **Verificações Duplas**: Validação de saldo antes e durante a transação

## Controladores HTTP

### CoinsController
- **getCoins**: Retorna o saldo atual do usuário
- **addCoins**: Adiciona coins ao saldo
- **removeCoins**: Remove coins do saldo
- **Documentação Swagger**: Schemas e endpoints documentados

## Configuração de Rotas

### Rotas Protegidas
Todas as rotas requerem autenticação via middleware `requireAuth`:

- `GET /coins` → `CoinsController.getCoins`
- `POST /coins/add` → `CoinsController.addCoins`
- `POST /coins/remove` → `CoinsController.removeCoins`

## Tratamento de Erros

### Tipos de Erro
1. **Usuário não encontrado**: Quando o ID do usuário é inválido
2. **Saldo insuficiente**: Quando não há coins suficientes para a operação
3. **Erro de transação**: Falhas durante operações no banco de dados
4. **Validação de entrada**: Dados inválidos ou malformados

### Códigos de Status
- `200`: Operação realizada com sucesso
- `400`: Dados de entrada inválidos
- `401`: Usuário não autenticado
- `404`: Usuário não encontrado
- `422`: Saldo insuficiente ou regra de negócio violada
- `500`: Erro interno do servidor

## Dependências

### Principais
- **@prisma/client**: ORM para interação com banco de dados
- **express**: Framework web para rotas HTTP
- **@/modules/crud**: Repositório genérico para operações CRUD

### Middlewares
- **requireAuth**: Middleware de autenticação
- **Validação de entrada**: Sanitização e validação de dados

## Segurança

### Autenticação
- **JWT Token**: Todas as rotas protegidas por autenticação
- **Validação de usuário**: Verificação de existência e permissões

### Validação de Dados
- **Sanitização de entrada**: Limpeza de dados recebidos
- **Validação de tipos**: Verificação de tipos de dados
- **Limites de valores**: Controle de valores mínimos e máximos

### Proteção de Dados
- **Transações atômicas**: Garantia de consistência
- **Logs de auditoria**: Preparação para rastreamento de operações
- **Rate limiting**: Proteção contra abuso (a ser implementado)

## Integração com Outros Módulos

### Módulo Auth
- **Autenticação**: Verificação de usuários autenticados
- **Autorização**: Controle de acesso às funcionalidades

### Módulo Users
- **Perfil do usuário**: Acesso aos dados do usuário
- **Validação de existência**: Verificação de usuários válidos

### Módulos Futuros
- **Loja**: Sistema de compras com coins
- **Recompensas**: Sistema de premiação
- **Analytics**: Métricas de uso de coins

## Considerações de Performance

### Otimizações Atuais
- **Repositório genérico**: Reutilização de código CRUD
- **Consultas diretas**: Acesso direto ao banco sem joins desnecessários
- **Validações eficientes**: Verificações rápidas antes de operações custosas

### Limitações
- **Sem cache**: Consultas sempre vão ao banco de dados
- **Sem histórico**: Não há rastreamento de transações
- **Sem rate limiting**: Possibilidade de abuso de endpoints

### Estratégias de Melhoria
- **Cache Redis**: Cache de saldos frequentemente consultados
- **Batch operations**: Processamento em lote para múltiplas operações
- **Índices de banco**: Otimização de consultas por usuário

## Próximas Melhorias

### Funcionalidades
1. **Histórico de transações**: Tabela dedicada para rastreamento
2. **Categorização**: Tipos de transações (compra, recompensa, transferência)
3. **Limites diários**: Controle de gastos e ganhos por período
4. **Sistema de recompensas**: Integração com achievements
5. **Marketplace**: Compra e venda entre usuários

### Técnicas
1. **Cache inteligente**: Redis para saldos e histórico
2. **Rate limiting**: Proteção contra spam
3. **Auditoria completa**: Logs detalhados de todas as operações
4. **Notificações**: Alertas de movimentações importantes
5. **Analytics**: Métricas de uso e economia virtual

### Segurança
1. **2FA para transferências**: Autenticação adicional
2. **Detecção de fraude**: Algoritmos de detecção de padrões suspeitos
3. **Backup de transações**: Redundância de dados críticos
4. **Criptografia**: Proteção adicional de dados sensíveis

## Testes

### Testes Unitários
- **Handlers**: Testes de lógica de negócio
- **Controllers**: Testes de endpoints HTTP
- **Validações**: Testes de regras de negócio
- **Cenários de erro**: Testes de tratamento de exceções

### Testes de Integração
- **Fluxos completos**: Testes end-to-end
- **Transações**: Testes de consistência
- **Concorrência**: Testes de operações simultâneas

### Cobertura
- **Handlers**: 100% das funções testadas
- **Controllers**: Todos os endpoints cobertos
- **Cenários de erro**: Casos de falha validados
- **Edge cases**: Situações limite testadas

## Documentação Swagger

O módulo possui documentação completa no Swagger com:
- **Schemas**: Definição de todos os tipos de dados
- **Endpoints**: Documentação de todas as rotas
- **Exemplos**: Casos de uso e respostas
- **Códigos de erro**: Documentação de possíveis falhas

Acesse a documentação em: `/api-docs#/Coins`