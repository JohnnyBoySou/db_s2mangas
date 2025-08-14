import fs from 'fs';
import path from 'path';

// Tipos para os dados dos templates
export interface VerificationEmailData {
    userName: string;
    verificationCode: string;
}

export interface VerificationResendEmailData {
    userName: string;
    verificationCode: string;
}

// Enum para os tipos de template
export enum EmailTemplateType {
    VERIFICATION = 'verification',
    VERIFICATION_RESEND = 'verification-resend'
}

// Classe para gerenciar templates de email
export class EmailTemplateManager {
    private templatesPath: string;
    private templateCache: Map<string, string> = new Map();

    constructor() {
        // Usa o diretório raiz do projeto para garantir que o caminho funcione
        this.templatesPath = path.join(process.cwd(), 'src', 'templates', 'email');
    }

    /**
     * Carrega um template HTML do arquivo
     */
    private loadTemplate(templateName: string): string {
        // Verifica se o template já está no cache
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        const templatePath = path.join(this.templatesPath, `${templateName}.html`);
        
        //console.log(`Tentando carregar template: ${templatePath}`);
        //console.log(`Templates path: ${this.templatesPath}`);
        
        try {
            const template = fs.readFileSync(templatePath, 'utf8');
            this.templateCache.set(templateName, template);
            // console.log(`Template ${templateName} carregado com sucesso`);
            return template;
        } catch (error) {
            // console.error(`Erro ao carregar template ${templateName}:`, error);
            // console.error(`Caminho tentado: ${templatePath}`);
            // console.error(`Diretório existe: ${fs.existsSync(this.templatesPath)}`);
            if (fs.existsSync(this.templatesPath)) {
                console.error(`Arquivos no diretório:`, fs.readdirSync(this.templatesPath));
            }
            throw new Error(`Template ${templateName} não encontrado`);
        }
    }

    /**
     * Processa um template substituindo as variáveis
     */
    private processTemplate(template: string, data: Record<string, any>): string {
        let processedTemplate = template;

        // Substitui todas as variáveis no formato {{variableName}}
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedTemplate = processedTemplate.replace(regex, data[key]);
        });

        return processedTemplate;
    }

    /**
     * Gera o HTML do email de verificação
     */
    public generateVerificationEmail(data: VerificationEmailData): string {
        const template = this.loadTemplate(EmailTemplateType.VERIFICATION);
        return this.processTemplate(template, data);
    }

    /**
     * Gera o HTML do email de reenvio de código
     */
    public generateVerificationResendEmail(data: VerificationResendEmailData): string {
        const template = this.loadTemplate(EmailTemplateType.VERIFICATION_RESEND);
        return this.processTemplate(template, data);
    }

    /**
     * Limpa o cache de templates (útil para desenvolvimento)
     */
    public clearCache(): void {
        this.templateCache.clear();
    }

    /**
     * Pré-carrega todos os templates no cache
     */
    public preloadTemplates(): void {
        const templates = Object.values(EmailTemplateType);
        templates.forEach(template => {
            try {
                this.loadTemplate(template);
            } catch {
                console.warn(`Aviso: Template ${template} não pôde ser pré-carregado`);
            }
        });
    }
}

// Instância singleton do gerenciador de templates
export const emailTemplateManager = new EmailTemplateManager();

// Funções de conveniência para usar diretamente
export const generateVerificationEmail = (data: VerificationEmailData): string => {
    return emailTemplateManager.generateVerificationEmail(data);
};

export const generateVerificationResendEmail = (data: VerificationResendEmailData): string => {
    return emailTemplateManager.generateVerificationResendEmail(data);
};

// Pré-carrega os templates na inicialização
emailTemplateManager.preloadTemplates();