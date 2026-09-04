#!/bin/bash
echo "1. Login with AdminSaipul123!..."
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"AdminSaipul123!"}' > login1.json
cat login1.json
echo ""

TOKEN=$(cat login1.json | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -z "$TOKEN" ]; then
  echo "Login failed. Attempting login with RabPro\$2026Secure!"
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"saipulabe@gmail.com","password":"RabPro$2026Secure!"}' > login1.json
  cat login1.json
  TOKEN=$(cat login1.json | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
  if [ -z "$TOKEN" ]; then
     echo "Both failed!"
     exit 1
  fi
  echo "2. Resetting back to RabPro\$2026Secure2!"
  curl -s -X POST http://localhost:3000/api/auth/change-password \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"oldPassword":"RabPro$2026Secure!","newPassword":"RabPro$2026Secure2!"}'
  echo ""
  exit 0
fi

echo "2. Change password to RabPro\$2026Secure!..."
curl -s -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"oldPassword":"AdminSaipul123!","newPassword":"RabPro$2026Secure!"}'
echo ""
