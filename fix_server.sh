#!/bin/bash
sed -i '/console.log('\''Users store loaded successfully.'\'');/a \
    \
    // FORCE SYNC ADMIN PASSWORD WITH ENVIRONMENT VARIABLE ON BOOT\
    const adminUsr = usersDb.get(adminEmail);\
    if (adminUsr) {\
      adminUsr.passwordHash = hashPassword(initialPassword!);\
      usersDb.set(adminEmail, adminUsr);\
      saveUsersStore();\
      console.log('\''Admin password synchronized with environment variable.'\'');\
    }' server.ts
