const email = "saipulabe5@gmail.com";
const password = process.env.ADMIN_INITIAL_PASSWORD;
console.log("Testing with email:", email, "password:", password);
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
}).then(res => {
  console.log("Status:", res.status);
  return res.json();
}).then(data => console.log(data));
