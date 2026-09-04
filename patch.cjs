const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const updated = content.replace(/async function loadUsersStore\(\) \{[\s\S]*?loadUsersStore\(\);/, `async function loadUsersStore() {
  try {
    const data = await fs.promises.readFile(USERS_STORE_PATH, 'utf-8');
    const entries = JSON.parse(data);
    for (const [key, value] of entries) {
      usersDb.set(key, value);
    }
    console.log('Users store loaded successfully.');
    
    let adminUsr = usersDb.get(adminEmail);
    if (!adminUsr) {
      usersDb.clear();
      const newAdmin = {
        id: "usr_admin_main",
        name: "Administrator",
        email: adminEmail,
        passwordHash: hashPassword(initialPassword),
        companyName: "RAB Pro Enterprise",
        role: "administrator",
        createdAt: new Date().toISOString(),
      };
      usersDb.set(adminEmail, newAdmin);
      saveUsersStore();
      console.log("Admin account seeded for the first time.");
    } else {
      console.log("Existing admin account loaded — password from storage preserved, NOT overwritten by env var.");
    }
  } catch (error) {
    usersDb.set(adminEmail, {
      id: "usr_admin_main",
      name: "Administrator",
      email: adminEmail,
      passwordHash: hashPassword(initialPassword),
      companyName: "RAB Pro Enterprise",
      role: "administrator",
      createdAt: new Date().toISOString(),
    });
    saveUsersStore();
    console.log("Admin account seeded for the first time (storage did not exist).");
  }
}
loadUsersStore();`);

fs.writeFileSync('server.ts', updated);
