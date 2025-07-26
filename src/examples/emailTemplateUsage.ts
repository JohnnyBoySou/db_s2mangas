/**
 * Exemplo de uso do sistema de templates de email
 * 
 * Este arquivo demonstra como utilizar o sistema de templates
 * para enviar emails com design personalizado
 */

import { 
    generateVerificationEmail, 
    generateVerificationResendEmail,
    emailTemplateManager,
    EmailTemplateType
} from '@/utils/emailTemplates';

// Exemplo 1: Gerando email de verificação
console.log('=== Exemplo 1: Email de Verificação ===');

const verificationEmailHtml = generateVerificationEmail({
    userName: 'João Silva',
    verificationCode: '123456'
});

console.log('HTML do email de verificação gerado com sucesso!');
console.log('Tamanho:', verificationEmailHtml.length, 'caracteres');
console.log('Contém nome do usuário:', verificationEmailHtml.includes('João Silva'));
console.log('Contém código:', verificationEmailHtml.includes('123456'));

// Exemplo 2: Gerando email de reenvio
console.log('\n=== Exemplo 2: Email de Reenvio ===');

const resendEmailHtml = generateVerificationResendEmail({
    userName: 'Maria Santos',
    verificationCode: '789012'
});

console.log('HTML do email de reenvio gerado com sucesso!');
console.log('Tamanho:', resendEmailHtml.length, 'caracteres');
console.log('Contém nome do usuário:', resendEmailHtml.includes('Maria Santos'));
console.log('Contém código:', resendEmailHtml.includes('789012'));

// Exemplo 3: Usando o manager diretamente
console.log('\n=== Exemplo 3: Usando o Manager Diretamente ===');

const directEmailHtml = emailTemplateManager.generateVerificationEmail({
    userName: 'Carlos Pereira',
    verificationCode: '345678'
});

console.log('HTML gerado através do manager diretamente!');
console.log('Contém nome do usuário:', directEmailHtml.includes('Carlos Pereira'));

// Exemplo 4: Operações de cache
console.log('\n=== Exemplo 4: Operações de Cache ===');

// Limpar cache (útil durante desenvolvimento)
emailTemplateManager.clearCache();
console.log('Cache limpo!');

// Pré-carregar templates
emailTemplateManager.preloadTemplates();
console.log('Templates pré-carregados!');

// Exemplo 5: Simulação de envio de email
console.log('\n=== Exemplo 5: Simulação de Envio de Email ===');

interface EmailData {
    from: string;
    to: string;
    subject: string;
    html: string;
}

function simulateEmailSend(emailData: EmailData): void {
    console.log(`\nSimulando envio de email:`);
    console.log(`De: ${emailData.from}`);
    console.log(`Para: ${emailData.to}`);
    console.log(`Assunto: ${emailData.subject}`);
    console.log(`HTML: ${emailData.html.length} caracteres`);
    console.log(`Status: ✅ Email enviado com sucesso!`);
}

// Simulando envio de email de verificação
const emailData: EmailData = {
    from: '"S2Mangás" <noreply@s2mangas.com>',
    to: 'usuario@example.com',
    subject: 'Verificação de Email - S2Mangás',
    html: generateVerificationEmail({
        userName: 'Usuário Exemplo',
        verificationCode: '987654'
    })
};

simulateEmailSend(emailData);

// Exemplo 6: Tratamento de erros
console.log('\n=== Exemplo 6: Tratamento de Erros ===');

try {
    // Tentativa de usar template inexistente
    const invalidTemplate = emailTemplateManager.generateVerificationEmail({
        userName: '',
        verificationCode: ''
    });
    console.log('Template gerado mesmo com dados vazios (isso pode ser um problema)');
} catch (error) {
    console.error('Erro ao gerar template:', error);
}

// Exemplo 7: Validação de dados
console.log('\n=== Exemplo 7: Validação de Dados ===');

function validateEmailData(userName: string, verificationCode: string): boolean {
    if (!userName || userName.trim().length === 0) {
        console.error('❌ Nome do usuário é obrigatório');
        return false;
    }
    
    if (!verificationCode || verificationCode.length !== 6) {
        console.error('❌ Código de verificação deve ter 6 dígitos');
        return false;
    }
    
    if (!/^\d{6}$/.test(verificationCode)) {
        console.error('❌ Código de verificação deve conter apenas números');
        return false;
    }
    
    return true;
}

// Teste de validação
const testData = [
    { userName: 'João Silva', verificationCode: '123456' },
    { userName: '', verificationCode: '123456' },
    { userName: 'Maria Santos', verificationCode: '12345' },
    { userName: 'Carlos Pereira', verificationCode: 'abc123' },
];

testData.forEach((data, index) => {
    console.log(`\nTeste ${index + 1}:`);
    console.log(`Dados: ${JSON.stringify(data)}`);
    const isValid = validateEmailData(data.userName, data.verificationCode);
    console.log(`Resultado: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
    
    if (isValid) {
        const html = generateVerificationEmail(data);
        console.log(`Template gerado: ${html.length} caracteres`);
    }
});

export {
    generateVerificationEmail,
    generateVerificationResendEmail,
    emailTemplateManager,
    EmailTemplateType
}; 