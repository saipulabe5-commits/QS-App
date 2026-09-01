import fetch from "node-fetch";

async function run() {
    const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "saipulabe@gmail.com", password: "gunakan-password-kuat-yang-baru" })
    });
    const data = await res.json();
    console.log(res.status, data);
}
run();
