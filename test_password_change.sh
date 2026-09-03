#!/bin/bash
echo "1. Login with current password..."
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"gunakan-password-kuat-yang-baru"}' > login1.json
cat login1.json
echo ""

TOKEN=$(cat login1.json | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

echo "2. Change password..."
curl -s -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"oldPassword":"gunakan-password-kuat-yang-baru","newPassword":"RabPro#2026Secure!"}'
echo ""
