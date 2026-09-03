#!/bin/bash
sed -i '/const adminUsr = usersDb.get(adminEmail);/c \
    let adminUsr = usersDb.get(adminEmail);\
    if (!adminUsr) {\
      // If admin email changed in env vars, delete old ones and create new\
      usersDb.clear();\
      adminUsr = {\
        id: "usr_admin_main",\
        name: "Administrator",\
        email: adminEmail,\
        passwordHash: hashPassword(initialPassword!),\
        companyName: "RAB Pro Enterprise",\
        role: "administrator",\
        createdAt: new Date().toISOString(),\
      };\
    }\
    adminUsr.passwordHash = hashPassword(initialPassword!);' server.ts
