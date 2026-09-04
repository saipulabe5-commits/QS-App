#!/bin/bash
echo "--- Testing OLD PASSWORD (should fail) ---"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"AdminSaipul123!"}'
echo ""
echo "--- Testing NEW PASSWORD (should succeed) ---"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com","password":"RabPro$2026Secure!"}'
echo ""
