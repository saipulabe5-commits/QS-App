#!/bin/bash
echo "1. Login with NEW password..."
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"RabPro#2026Secure!"}'
echo ""
echo ""

echo "2. Login with OLD password..."
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"gunakan-password-kuat-yang-baru"}'
echo ""
