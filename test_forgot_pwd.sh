#!/bin/bash
curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"saipulabe@gmail.com"}'
