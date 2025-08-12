# Templates de Email - S2Mangás

Este diretório contém os templates HTML para os emails enviados pelo sistema de autenticação.

## Estrutura de Arquivos

```
src/templates/email/
├── README.md                    # Este arquivo
├── verification.html            # Template para verificação de email
└── verification-resend.html     # Template para reenvio de código
```

## Templates Disponíveis

### 1. verification.html
- **Usado em**: Registro de novo usuário
- **Propósito**: Enviar código de verificação inicial
- **Variáveis disponíveis**:
  - `{{userName}}` - Nome do usuário
  - `{{verificationCode}}` - Código de 6 dígitos

### 2. verification-resend.html
- **Usado em**: Login com email não verificado
- **Propósito**: Reenviar código de verificação
- **Variáveis disponíveis**:
  - `{{userName}}` - Nome do usuário
  - `{{verificationCode}}` - Código de 6 dígitos

## Como Usar

### No Código TypeScript

```typescript
import { generateVerificationEmail, generateVerificationResendEmail } from '@/utils/emailTemplates';

// Para email de verificação inicial
const emailHtml = generateVerificationEmail({
    userName: 'João Silva',
    verificationCode: '123456'
});

// Para reenvio de código
const emailHtml = generateVerificationResendEmail({
    userName: 'João Silva',
    verificationCode: '654321'
});
```

### Sistema de Variáveis

As variáveis nos templates seguem o padrão `{{variableName}}` e são substituídas automaticamente pelos valores fornecidos.

## Adicionando Novos Templates

### 1. Criar o arquivo HTML
Adicione um novo arquivo `.html` neste diretório com o template desejado.

### 2. Adicionar ao enum
Edite `src/utils/emailTemplates.ts` e adicione o novo template ao enum `EmailTemplateType`:

```typescript
export enum EmailTemplateType {
    VERIFICATION = 'verification',
    VERIFICATION_RESEND = 'verification-resend',
    NEW_TEMPLATE = 'new-template'  // Adicione aqui
}
```

### 3. Criar interface de dados
Defina uma interface para os dados do template:

```typescript
export interface NewTemplateEmailData {
    userName: string;
    // outras variáveis necessárias
}
```

### 4. Adicionar método ao manager
Adicione um método público à classe `EmailTemplateManager`:

```typescript
public generateNewTemplateEmail(data: NewTemplateEmailData): string {
    const template = this.loadTemplate(EmailTemplateType.NEW_TEMPLATE);
    return this.processTemplate(template, data);
}
```

### 5. Exportar função de conveniência
Adicione uma função de conveniência no final do arquivo:

```typescript
export const generateNewTemplateEmail = (data: NewTemplateEmailData): string => {
    return emailTemplateManager.generateNewTemplateEmail(data);
};
```

## Características dos Templates

### Design Responsivo
- Os templates são otimizados para desktop e mobile
- Utilizam CSS inline para máxima compatibilidade
- Breakpoint em 600px para dispositivos móveis

### Estilo Visual
- Cores principais: #6366f1 (azul) e gradientes
- Tipografia: -apple-system e fallbacks
- Layout centralizado com máximo de 600px
- Bordas arredondadas e sombras suaves

### Elementos Comuns
- **Logo**: S2Mangás em destaque
- **Título**: Específico para cada tipo de email
- **Código**: Destaque especial com fundo colorido
- **Avisos**: Informações importantes em boxes coloridos
- **Rodapé**: Informações de contato e direitos autorais

## Considerações de Segurança

1. **Nunca** incluir informações sensíveis além do código de verificação
2. Os códigos têm validade de 10 minutos
3. Sempre incluir avisos de segurança sobre não compartilhar códigos
4. Links de contato para suporte em caso de problemas

## Testes

Para testar os templates durante o desenvolvimento:

```typescript
import { emailTemplateManager } from '@/utils/emailTemplates';

// Limpar cache durante desenvolvimento
emailTemplateManager.clearCache();

// Pré-carregar templates
emailTemplateManager.preloadTemplates();
```

## Suporte

Para dúvidas ou problemas com os templates de email:
- Email: suporte@s2mangas.com
- Documentação: Consulte este README e os comentários no código 