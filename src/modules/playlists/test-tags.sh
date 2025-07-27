#!/bin/bash

# Script de teste para as funcionalidades de tags das playlists
# Execute este script para testar todas as funcionalidades

BASE_URL="http://localhost:3000"
AUTH_TOKEN="seu_token_aqui"  # Substitua pelo token real

echo "🧪 Testando funcionalidades de tags das playlists..."
echo "=================================================="

# 1. Listar todas as tags disponíveis
echo "📋 1. Listando todas as tags disponíveis:"
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
     "$BASE_URL/playlists/tags/all" | jq '.[0:5]'

echo -e "\n"

# 2. Criar uma nova playlist com tags
echo "➕ 2. Criando playlist com tags:"
PLAYLIST_DATA='{
  "name": "Lofi Hip Hop Mix",
  "cover": "https://example.com/lofi-cover.jpg",
  "link": "https://spotify.com/playlist/lofi123",
  "description": "Música relaxante para estudar e trabalhar",
  "tags": ["lofi", "chill", "relaxing"]
}'

PLAYLIST_RESPONSE=$(curl -s -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d "$PLAYLIST_DATA" \
     "$BASE_URL/admin/playlists")

echo "$PLAYLIST_RESPONSE" | jq '.'
PLAYLIST_ID=$(echo "$PLAYLIST_RESPONSE" | jq -r '.id')

echo -e "\n"

# 3. Buscar playlists por tag específica
echo "🔍 3. Buscando playlists com tag 'lofi':"
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
     "$BASE_URL/playlists?tag=lofi" | jq '.data[0]'

echo -e "\n"

# 4. Buscar playlists por múltiplas tags
echo "🔍 4. Buscando playlists com tags 'lofi,chill':"
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
     "$BASE_URL/playlists/by-tags?tags=lofi,chill" | jq '.data[0]'

echo -e "\n"

# 5. Atualizar playlist adicionando mais tags
echo "✏️ 5. Atualizando playlist com mais tags:"
UPDATE_DATA='{
  "description": "Música relaxante para estudar, trabalhar e meditar",
  "tags": ["lofi", "chill", "relaxing", "ambient"]
}'

curl -s -X PUT \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d "$UPDATE_DATA" \
     "$BASE_URL/admin/playlists/$PLAYLIST_ID" | jq '.tags'

echo -e "\n"

# 6. Criar uma nova tag personalizada
echo "🏷️ 6. Criando nova tag personalizada:"
TAG_DATA='{
  "name": "synthwave",
  "color": "#FF6B9D"
}'

curl -s -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d "$TAG_DATA" \
     "$BASE_URL/admin/playlists/tags" | jq '.'

echo -e "\n"

# 7. Buscar playlist específica com tags
echo "📖 7. Buscando playlist específica com tags:"
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
     "$BASE_URL/playlists/$PLAYLIST_ID" | jq '.tags'

echo -e "\n"
echo "✅ Testes concluídos!"
echo "💡 Dica: Substitua 'seu_token_aqui' por um token válido para executar os testes"