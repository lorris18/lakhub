import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`${key} est requis pour verifier la cible Supabase.`);
    process.exit(1);
  }
}

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const checks = [];

function addCheck(name, state, detail) {
  checks.push({ name, state, detail });
}

function authHeaders({ apikey, bearer }) {
  return {
    ...(apikey ? { apikey } : {}),
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
  };
}

async function request(path, { token, apikey, bearer, method = "GET", body, headers } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? authHeaders({ apikey: token, bearer: token }) : {}),
      ...((apikey || bearer) ? authHeaders({ apikey, bearer }) : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();

  try {
    return { response, data: JSON.parse(text), text };
  } catch {
    return { response, data: text, text };
  }
}

async function verifyTables() {
  const tableChecks = [
    ["users", "id,email,role"],
    ["user_settings", "user_id,theme,email_notifications"],
    ["projects", "id,title,owner_user_id,status"],
    ["project_members", "project_id,user_id,role"],
    ["deliverables", "id,project_id,title,status"],
    ["invitations", "id,project_id,email,role,status,token"],
    ["documents", "id,title,owner_user_id,kind,status"],
    ["document_versions", "id,document_id,version_number,title,created_by"],
    ["submissions", "id,document_id,version_id,submitted_by,status"],
    ["citations", "id,document_id,citation_key"],
    ["comments", "id,document_id,author_user_id,body,status"],
    ["suggestions", "id,document_id,author_user_id,proposed_text,status"],
    ["notifications", "id,user_id,title,body,read_at"],
    ["library_items", "id,owner_user_id,title,item_type"],
    ["collections", "id,owner_user_id,name"],
    ["tags", "id,owner_user_id,name"],
    ["item_collections", "item_id,collection_id"],
    ["item_tags", "item_id,tag_id"],
    ["ai_conversations", "id,user_id,provider,mode,title"],
    ["ai_messages", "id,conversation_id,role,content"],
    ["ai_runs", "id,user_id,provider,mode,status"],
    ["ai_sources", "id,run_id,title,url"],
    ["ai_usage", "id,user_id,provider,usage_date,request_count"],
    ["ai_saved_outputs", "id,user_id,kind,title,content"],
    ["ai_prompt_templates", "id,owner_user_id,title,kind,is_system"],
    ["assets", "id,owner_user_id,bucket,path"],
    ["audit_logs", "id,actor_user_id,action,entity_type"]
  ];

  for (const [table, select] of tableChecks) {
    const { response, text } = await request(
      `/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1`,
      { token: serviceRoleKey }
    );

    addCheck(
      `table:${table}`,
      response.ok ? "ready" : "blocked",
      response.ok ? "accessible via service role" : text
    );
  }
}

async function verifyBuckets() {
  const { response, data, text } = await request("/storage/v1/bucket", { token: serviceRoleKey });

  if (!response.ok || !Array.isArray(data)) {
    addCheck("storage:buckets", "blocked", text);
    return;
  }

  const names = data.map((bucket) => bucket.name).sort();
  const expected = ["avatars", "documents"];
  const missing = expected.filter((bucket) => !names.includes(bucket));

  addCheck(
    "storage:buckets",
    missing.length === 0 ? "ready" : "blocked",
    missing.length === 0 ? names.join(", ") : `manquants: ${missing.join(", ")}`
  );
}

async function verifyAuthSettings() {
  const { response, data, text } = await request("/auth/v1/settings", { token: anonKey });

  if (!response.ok) {
    addCheck("auth:settings", "blocked", text);
    return;
  }

  addCheck(
    "auth:settings",
    data?.external?.email ? "ready" : "warning",
    data?.external?.email ? "email/password active" : "email/password desactive"
  );
}

async function verifySmokeUserFlow() {
  const email = `lakhub-smoke-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
  const password = process.env.LAKHUB_SMOKE_PASSWORD ?? `LakHub!${randomUUID().slice(0, 12)}`;
  let createdUserId = null;
  let createdProjectId = null;

  try {
    const createUser = await request("/auth/v1/admin/users", {
      token: serviceRoleKey,
      method: "POST",
      body: {
        email,
        password,
        email_confirm: true
      }
    });

    if (!createUser.response.ok) {
      addCheck("smoke:create-user", "blocked", createUser.text);
      return;
    }

    createdUserId = createUser.data.id;
    addCheck("smoke:create-user", "ready", "utilisateur de test cree");

    const profile = await request(
      `/rest/v1/users?select=id,email,role&id=eq.${encodeURIComponent(createdUserId)}`,
      { token: serviceRoleKey }
    );

    const profileCreated = profile.response.ok && Array.isArray(profile.data) && profile.data.length === 1;
    addCheck(
      "smoke:profile-trigger",
      profileCreated ? "ready" : "blocked",
      profileCreated ? "profil utilisateur cree automatiquement" : profile.text
    );

    const login = await request("/auth/v1/token?grant_type=password", {
      token: anonKey,
      method: "POST",
      body: { email, password }
    });

    if (!login.response.ok || !login.data?.access_token) {
      addCheck("smoke:login", "blocked", login.text);
      return;
    }

    addCheck("smoke:login", "ready", "connexion email/mot de passe valide");
    const userToken = login.data.access_token;

    const isolatedProjects = await request("/rest/v1/projects?select=id,title", {
      apikey: anonKey,
      bearer: userToken
    });
    const isolatedLibrary = await request("/rest/v1/library_items?select=id,title", {
      apikey: anonKey,
      bearer: userToken
    });

    addCheck(
      "smoke:rls-projects",
      isolatedProjects.response.ok && Array.isArray(isolatedProjects.data) && isolatedProjects.data.length === 0
        ? "ready"
        : "blocked",
      isolatedProjects.response.ok ? `resultats: ${isolatedProjects.data.length}` : isolatedProjects.text
    );

    addCheck(
      "smoke:rls-library",
      isolatedLibrary.response.ok && Array.isArray(isolatedLibrary.data) && isolatedLibrary.data.length === 0
        ? "ready"
        : "blocked",
      isolatedLibrary.response.ok ? `resultats: ${isolatedLibrary.data.length}` : isolatedLibrary.text
    );

    const createProject = await request("/rest/v1/projects", {
      apikey: anonKey,
      bearer: userToken,
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: {
        owner_user_id: createdUserId,
        title: "Smoke Project",
        status: "planning"
      }
    });

    const createdProject = Array.isArray(createProject.data) ? createProject.data[0] : null;

    addCheck(
      "smoke:create-project",
      createProject.response.ok && createdProject?.id ? "ready" : "blocked",
      createProject.response.ok ? "creation projet autorisee" : createProject.text
    );

    if (createdProject?.id) {
      createdProjectId = createdProject.id;

      const membership = await request(
        `/rest/v1/project_members?select=project_id,user_id,role&project_id=eq.${encodeURIComponent(
          createdProjectId
        )}&user_id=eq.${encodeURIComponent(createdUserId)}`,
        { token: serviceRoleKey }
      );

      const membershipRow = Array.isArray(membership.data) ? membership.data[0] : null;
      addCheck(
        "smoke:owner-membership-trigger",
        membership.response.ok && membershipRow?.role === "owner" ? "ready" : "blocked",
        membership.response.ok ? `role: ${membershipRow?.role ?? "absente"}` : membership.text
      );
    }

    const avatarUpload = await fetch(
      `${baseUrl}/storage/v1/object/avatars/${createdUserId}/smoke-avatar.txt`,
      {
        method: "POST",
        headers: {
          ...authHeaders({ apikey: anonKey, bearer: userToken }),
          "Content-Type": "text/plain",
          "x-upsert": "true"
        },
        body: "avatar-smoke"
      }
    );

    addCheck(
      "smoke:storage-avatar-upload",
      avatarUpload.ok ? "ready" : "blocked",
      avatarUpload.ok ? "upload avatar autorise" : await avatarUpload.text()
    );
  } finally {
    if (createdProjectId) {
      await request(`/rest/v1/projects?id=eq.${encodeURIComponent(createdProjectId)}`, {
        token: serviceRoleKey,
        method: "DELETE"
      });
    }

    if (createdUserId) {
      await request(`/auth/v1/admin/users/${createdUserId}`, {
        token: serviceRoleKey,
        method: "DELETE"
      });
    }
  }
}

async function main() {
  await verifyAuthSettings();
  await verifyTables();
  await verifyBuckets();
  await verifySmokeUserFlow();

  const blocked = checks.filter((check) => check.state === "blocked");
  const warnings = checks.filter((check) => check.state === "warning");

  console.log("LAKHub Supabase target verification");
  for (const check of checks) {
    console.log(`- [${check.state}] ${check.name}: ${check.detail}`);
  }

  if (blocked.length) {
    console.error(`Verification terminee avec ${blocked.length} blocage(s).`);
    process.exit(1);
  }

  if (warnings.length) {
    console.log(`Verification terminee avec ${warnings.length} avertissement(s).`);
    return;
  }

  console.log("Verification Supabase complete: cible propre et exploitable.");
}

await main();
