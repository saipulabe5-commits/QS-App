import fetch from "node-fetch";

async function run() {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "saipulabe@gmail.com", resetCode: "123456", newPassword: "password123" })
    });
    const data = await res.json();
    console.log(data);
}
run();
