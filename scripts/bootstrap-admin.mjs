import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const email = process.argv[2];
const role = process.argv[3] ?? "admin";

if (!email) {
  console.error("Usage: npm run bootstrap:admin -- user@example.com [admin|superadmin]");
  process.exit(1);
}

if (!["admin", "superadmin"].includes(role)) {
  console.error("Le rôle doit être admin ou superadmin.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const lookup = await admin.from("users").select("id, email, role").ilike("email", email).limit(1).maybeSingle();

if (lookup.error) {
  console.error(`Recherche utilisateur échouée: ${lookup.error.message}`);
  process.exit(1);
}

if (!lookup.data) {
  console.error("Aucun profil utilisateur correspondant. L’utilisateur doit d’abord se connecter une première fois.");
  process.exit(1);
}

const update = await admin
  .from("users")
  .update({ role })
  .eq("id", lookup.data.id)
  .select("id, email, role")
  .single();

if (update.error) {
  console.error(`Promotion admin échouée: ${update.error.message}`);
  process.exit(1);
}

console.log(`Utilisateur ${update.data.email} promu en ${update.data.role}.`);
