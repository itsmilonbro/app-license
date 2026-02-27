(async function () {

  async function sha256(message) {
    const buffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(message)
    );
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function block(msg) {
    document.documentElement.innerHTML =
      "<h2 style='color:red;text-align:center;margin-top:100px'>" + msg + "</h2>";
    throw new Error("Blocked");
  }

  const appId = document.querySelector('meta[name="app-id"]')?.content;
  const secret = document.querySelector('meta[name="app-secret"]')?.content;
  const integrity = document.querySelector('meta[name="app-integrity"]')?.content;

  if (!appId || !secret || !integrity) block("License Metadata Missing");

  try {
    const res = await fetch("https://itsmilonbro.github.io/app-license/license-db.json");
    const db = await res.json();

    const app = db.apps.find(a => a.appId === appId);
    if (!app) block("Invalid License");

    if (await sha256(secret) !== app.secretHash) block("Invalid Secret");
    if (integrity !== app.checksum) block("Integrity Failed");
    if (app.status !== "active") block("License Disabled");
    if (new Date() > new Date(app.expiry)) block("License Expired");

    // footer check section with this:
const footer = document.getElementById("app-credit");
const link = footer?.querySelector("a");

if (
  !footer ||
  !link ||
  !footer.innerText.includes("All right reserved copyright ©") ||
  link.href !== "https://itsmilonbro.blogspot.com" ||
  !link.innerText.includes("Freelancer Milon")
) {
  block("Credit Modified");
}

  } catch (e) {
    block("License Server Error");
  }

})();