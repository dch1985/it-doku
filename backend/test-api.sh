#!/bin/bash

# Test script for IT-Doku Backend API
# Testet alle CRUD-Operationen und Template-Seeding

BASE_URL="http://localhost:3001"
echo "======================================"
echo "IT-Doku Backend API Tests"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1. Health Check..."
curl -s "$BASE_URL/api/health" | jq '.' || echo "❌ Health Check fehlgeschlagen"
echo ""

# Test 2: Seed Templates
echo "2. Seeding NIST Templates..."
curl -s -X POST "$BASE_URL/api/templates/seed" | jq '.' || echo "❌ Seeding fehlgeschlagen"
echo ""

# Test 3: Get All Templates
echo "3. Alle Templates abrufen..."
TEMPLATES=$(curl -s "$BASE_URL/api/templates")
echo "$TEMPLATES" | jq '.templates[] | {id, title, category, type}' || echo "❌ Templates abrufen fehlgeschlagen"
echo ""

# Test 4: Create Document
echo "4. Neues Dokument erstellen..."
FIRST_TEMPLATE_ID=$(echo "$TEMPLATES" | jq -r '.templates[0].id')
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/documents" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Server Dokumentation\",
    \"content\": \"# Test Server\\n\\nDies ist ein Test-Dokument.\",
    \"category\": \"server\",
    \"status\": \"draft\",
    \"templateId\": \"$FIRST_TEMPLATE_ID\"
  }")
echo "$CREATE_RESPONSE" | jq '.' || echo "❌ Dokument erstellen fehlgeschlagen"
DOC_ID=$(echo "$CREATE_RESPONSE" | jq -r '.document.id')
echo "Created Document ID: $DOC_ID"
echo ""

# Test 5: Get All Documents
echo "5. Alle Dokumente abrufen..."
curl -s "$BASE_URL/api/documents" | jq '.documents[] | {id, title, category, status}' || echo "❌ Dokumente abrufen fehlgeschlagen"
echo ""

# Test 6: Get Single Document
echo "6. Einzelnes Dokument abrufen..."
curl -s "$BASE_URL/api/documents/$DOC_ID" | jq '.document | {id, title, category, status}' || echo "❌ Dokument abrufen fehlgeschlagen"
echo ""

# Test 7: Update Document
echo "7. Dokument aktualisieren..."
curl -s -X PUT "$BASE_URL/api/documents/$DOC_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Server Dokumentation - UPDATED\",
    \"status\": \"review\"
  }" | jq '.' || echo "❌ Dokument aktualisieren fehlgeschlagen"
echo ""

# Test 8: Get Document Stats
echo "8. Dokumenten-Statistiken abrufen..."
curl -s "$BASE_URL/api/documents/stats" | jq '.' || echo "❌ Statistiken abrufen fehlgeschlagen"
echo ""

# Test 9: Filter Documents by Category
echo "9. Dokumente nach Kategorie filtern (server)..."
curl -s "$BASE_URL/api/documents?category=server" | jq '.documents[] | {id, title, category}' || echo "❌ Filter fehlgeschlagen"
echo ""

# Test 10: Delete Document
echo "10. Dokument löschen..."
curl -s -X DELETE "$BASE_URL/api/documents/$DOC_ID" | jq '.' || echo "❌ Dokument löschen fehlgeschlagen"
echo ""

echo "======================================"
echo "✅ Alle Tests abgeschlossen!"
echo "======================================"
