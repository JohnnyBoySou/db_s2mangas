export function generateUsername(name: string): string {
    const normalized = name
      .normalize("NFD")                // separa letras e acentos
      .replace(/[\u0300-\u036f]/g, '') // remove os acentos
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/(^_+|_+$)/g, '');
  
    const timestamp = Date.now();
    return `${normalized}_${timestamp}`;
  }
  