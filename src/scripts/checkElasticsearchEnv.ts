import 'dotenv/config';

console.log('🔍 Verificando variáveis de ambiente do Elasticsearch...\n');

const envVars = {
  ELASTIC_URL: process.env.ELASTIC_URL,
  ELASTIC_INTERNAL_URL: process.env.ELASTIC_INTERNAL_URL,
  ELASTIC_USERNAME: process.env.ELASTIC_USERNAME,
  ELASTIC_PASSWORD: process.env.ELASTIC_PASSWORD,
  NODE_ENV: process.env.NODE_ENV
};

console.log('📋 Variáveis de ambiente:');
Object.entries(envVars).forEach(([key, value]) => {
  if (key.includes('PASSWORD')) {
    console.log(`   ${key}: ${value ? '✅ Configurado' : '❌ Não configurado'}`);
  } else {
    console.log(`   ${key}: ${value || '❌ Não configurado'}`);
  }
});

console.log('\n🔐 Status da autenticação:');
const hasUsername = !!envVars.ELASTIC_USERNAME;
const hasPassword = !!envVars.ELASTIC_PASSWORD;
console.log(`   Username configurado: ${hasUsername ? '✅' : '❌'}`);
console.log(`   Password configurado: ${hasPassword ? '✅' : '❌'}`);
console.log(`   Autenticação habilitada: ${hasUsername && hasPassword ? '✅' : '❌'}`);

console.log('\n🌐 URLs configuradas:');
console.log(`   URL pública: ${envVars.ELASTIC_URL || '❌ Não configurado'}`);
console.log(`   URL interna: ${envVars.ELASTIC_INTERNAL_URL || '❌ Não configurado'}`);

if (!hasUsername || !hasPassword) {
  console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
  console.log('   As credenciais do Elasticsearch não estão configuradas corretamente.');
  console.log('   Isso está causando autenticação como usuário anônimo sem permissões.');
  console.log('\n💡 SOLUÇÕES:');
  console.log('   1. Configure ELASTIC_USERNAME e ELASTIC_PASSWORD no Railway');
  console.log('   2. Ou crie um arquivo .env local com essas variáveis');
  console.log('   3. Ou configure as variáveis de ambiente no sistema');
}
