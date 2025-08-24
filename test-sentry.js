const axios = require('axios');

async function testSentry() {
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  
  console.log('🧪 Testando configuração do Sentry...');
  console.log(`📍 URL base: ${baseURL}`);
  
  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('\n1️⃣ Verificando se o servidor está rodando...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Servidor está rodando');
    console.log('📊 Status:', healthResponse.status);
    
    // Teste 2: Testar a rota de debug do Sentry
    console.log('\n2️⃣ Testando rota de debug do Sentry...');
    const sentryResponse = await axios.get(`${baseURL}/debug-sentry`);
    console.log('✅ Rota de debug do Sentry funcionando');
    console.log('📊 Status:', sentryResponse.status);
    console.log('📄 Resposta:', sentryResponse.data);
    
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('📝 Verifique o painel do Sentry para ver se os eventos foram recebidos.');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erro na resposta:', error.response.status);
      console.log('📄 Dados:', error.response.data);
    } else if (error.request) {
      console.log('❌ Erro de conexão:', error.message);
      console.log('💡 Certifique-se de que o servidor está rodando em', baseURL);
    } else {
      console.log('❌ Erro:', error.message);
    }
  }
}

// Executar o teste
testSentry();
