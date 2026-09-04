sed -i '/\/\/ FORCE SYNC ADMIN PASSWORD WITH ENVIRONMENT VARIABLE ON BOOT/,/if (adminUsr) {/c\
    let adminUsr = usersDb.get(adminEmail);\
    if (!adminUsr) {\
      // Seed pertama kali SAJA — akun belum pernah ada\
      usersDb.clear();\
      const newAdmin: ServerUser = {\
        id: "usr_admin_main",\
        name: "Administrator",\
        email: adminEmail,\
        passwordHash: hashPassword(initialPassword!),\
        companyName: "RAB Pro Enterprise",\
        role: "administrator",\
        createdAt: new Date().toISOString(),\
      };\
      usersDb.set(adminEmail, newAdmin);\
      saveUsersStore();\
      console.log("Admin account seeded for the first time.");\
    } else {\
      console.log("Existing admin account loaded — password from storage preserved, NOT overwritten by env var.");\
    }' server.ts
