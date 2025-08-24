import fs from 'fs';
import path from 'path';

export interface VerificationEmailData {
    userName: string;
    verificationCode: string;
}

export interface VerificationResendEmailData {
    userName: string;
    verificationCode: string;
}

export enum EmailTemplateType {
    VERIFICATION = 'verification',
    VERIFICATION_RESEND = 'verification-resend'
}

const templateCache: Map<string, string> = new Map();

const findTemplatesPath = (): string => {
    const possiblePaths = [
        path.join(process.cwd(), 'src', 'templates', 'email'),
        path.join(process.cwd(), 'dist', 'templates', 'email'),
        path.join(__dirname, '..', 'templates', 'email'),
        path.join(__dirname, '..', '..', 'templates', 'email'),
    ];

    for (const templatePath of possiblePaths) {
        if (fs.existsSync(templatePath)) {
            return templatePath;
        }
    }

    const pathList = possiblePaths.map(p => `  - ${p}`).join('\n');
    const errorMessage = `Diretório de templates não encontrado. Caminhos tentados:\n${pathList}`;
    throw new Error(errorMessage);
};

const templatesPath = findTemplatesPath();

const loadTemplate = (templateName: string): string => {
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName)!;
    }

    const templatePath = path.join(templatesPath, `${templateName}.html`);
    
    try {
        const template = fs.readFileSync(templatePath, 'utf8');
        templateCache.set(templateName, template);
        return template;
    } catch (error) {
        console.error(`Erro ao carregar template ${templateName}:`, error);
        console.error(`Caminho tentado: ${templatePath}`);
        console.error(`Diretório existe: ${fs.existsSync(templatesPath)}`);
        if (fs.existsSync(templatesPath)) {
            console.error(`Arquivos no diretório:`, fs.readdirSync(templatesPath));
        }
        throw new Error(`Template ${templateName} não encontrado`);
    }
};

const processTemplate = (template: string, data: Record<string, any>): string => {
    let processedTemplate = template;

    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedTemplate = processedTemplate.replace(regex, data[key]);
    });

    return processedTemplate;
};

const clearCache = (): void => {
    templateCache.clear();
};

const preloadTemplates = (): void => {
    const templates = Object.values(EmailTemplateType);
    templates.forEach(template => {
        try {
            loadTemplate(template);
        } catch (error) {
            console.warn(`Aviso: Template ${template} não pôde ser pré-carregado:`, error);
        }
    });
};

const EmailTemplateManager = {
    generateVerificationEmail: (data: VerificationEmailData): string => {
        const template = loadTemplate(EmailTemplateType.VERIFICATION);
        return processTemplate(template, data);
    },

    generateVerificationResendEmail: (data: VerificationResendEmailData): string => {
        const template = loadTemplate(EmailTemplateType.VERIFICATION_RESEND);
        return processTemplate(template, data);
    },
    loadTemplate,
    processTemplate,
    clearCache,
    preloadTemplates
};

export const generateVerificationEmail = (data: VerificationEmailData): string => {
    return EmailTemplateManager.generateVerificationEmail(data);
};

export const generateVerificationResendEmail = (data: VerificationResendEmailData): string => {
    return EmailTemplateManager.generateVerificationResendEmail(data);
};

EmailTemplateManager.preloadTemplates();

export default EmailTemplateManager;