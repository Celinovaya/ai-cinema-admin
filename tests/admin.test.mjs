import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");

// Compile the real TypeScript modules in memory; replace only framework/database boundaries.
function load(file, mocks = {}) {
  const filename = path.resolve(projectRoot, file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiledModule = { exports: {} };
  const customRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, mocks);
    if (name.startsWith(".")) return load(path.relative(projectRoot, path.resolve(path.dirname(filename), `${name}.ts`)), mocks);
    return nativeRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(customRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const { getSection, sections } = load("lib/admin/sections.ts");
const { validateValues, databaseMessage } = load("lib/admin/validation.ts");
const id = "ea385fdd-8799-44ae-b3a8-b284d734ce99";

test("all eleven new tables have unique routes and expected access modes", () => {
  assert.equal(sections.length, 11);
  assert.equal(new Set(sections.map((s) => s.slug)).size, 11);
  assert.equal(sections.filter((s) => s.mode === "crud").length, 6);
  assert.equal(sections.filter((s) => s.mode === "read").length, 4);
  assert.equal(getSection("profiles"), undefined);
});

test("mix rejects extra writable fields and invalid numeric precision/ranges", () => {
  const mix = getSection("prompt-chain-mix");
  assert.deepEqual(validateValues(mix, { weight: "0", is_active: false }), { weight: 0, is_active: false });
  for (const weight of ["-1", "1000", "1.001", "NaN", "Infinity", ""]) assert.throws(() => validateValues(mix, { weight, is_active: true }));
  assert.throws(() => validateValues(mix, { weight: "1", is_active: true, chain_id: id }));
  assert.throws(() => validateValues(mix, { weight: "1", is_active: "true" }));
});

test("domain and email forms normalize case and reject malformed inputs", () => {
  assert.equal(validateValues(getSection("allowed-signup-domains"), { domain: " Example.COM ", is_active: true }).domain, "example.com");
  for (const domain of ["https://example.com", "@example.com", "example.com/path", "-bad.com", "a..com"]) assert.throws(() => validateValues(getSection("allowed-signup-domains"), { domain, is_active: true }));
  assert.equal(validateValues(getSection("whitelisted-emails"), { email: " User@Example.COM ", is_active: true }).email, "user@example.com");
  assert.throws(() => validateValues(getSection("whitelisted-emails"), { email: "no-address", is_active: true }));
});

test("model validates nullable provider and integer context window", () => {
  const model = { name: "Model", model_key: "model-v1", provider_id: "", context_window: "", is_active: true };
  assert.equal(validateValues(getSection("llm-models"), model).provider_id, null);
  assert.equal(validateValues(getSection("llm-models"), model).context_window, null);
  for (const context_window of ["0", "1.5", "2147483648"]) assert.throws(() => validateValues(getSection("llm-models"), { ...model, context_window }));
  assert.throws(() => validateValues(getSection("llm-models"), { ...model, provider_id: "invalid" }));
});

test("provider URLs do not accept embedded credentials or query secrets", () => {
  for (const api_base_url of ["javascript:alert(1)", "https://user:password@example.com", "https://example.com?key=secret"]) assert.throws(() => validateValues(getSection("llm-providers"), { name: "Provider", api_base_url, is_active: true }));
});

test("required values and unknown fields are validated on the server", () => {
  assert.throws(() => validateValues(getSection("terms"), { term: "  ", is_blocked: false }));
  assert.throws(() => validateValues(getSection("terms"), { term: "Test", is_blocked: false, is_superadmin: true }));
  assert.equal(validateValues(getSection("terms"), { term: "Test", is_blocked: false, notes: "", category: "" }).notes, null);
});

for (const scenario of ["anonymous", "non-admin", "profile-error", "admin"]) {
  test(`authorization handles ${scenario}`, async () => {
    const client = {
      auth: { getUser: async () => ({ data: { user: scenario === "anonymous" ? null : { id } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { is_superadmin: scenario === "admin" }, error: scenario === "profile-error" ? { code: "42501" } : null }) }) }) }),
    };
    const { getAdminAccess } = load("lib/admin/auth.ts", { "server-only": {}, "@/lib/supabase/server": { createClient: async () => client } });
    assert.equal((await getAdminAccess()).allowed, scenario === "admin");
  });
}

function actionHarness({ allowed = true, error = null } = {}) {
  const calls = [];
  const chain = {
    insert: (values) => { calls.push(["insert", values]); return chain; },
    update: (values) => { calls.push(["update", values]); return chain; },
    delete: () => { calls.push(["delete"]); return chain; },
    eq: (...args) => { calls.push(["eq", ...args]); return chain; },
    select: () => chain,
    single: async () => ({ data: error ? null : { id }, error }),
  };
  const action = load("app/admin/actions.ts", {
    "next/cache": { revalidatePath: (p) => calls.push(["revalidate", p]) },
    "@/lib/admin/auth": { getAdminAccess: async () => ({ allowed, message: "Access denied", supabase: { from: (table) => { calls.push(["from", table]); return chain; } } }) },
  });
  return { mutate: action.mutateRecord, calls };
}

test("unauthorized direct mutations never reach the database", async () => {
  const { mutate, calls } = actionHarness({ allowed: false });
  for (const op of ["create", "update", "delete"]) assert.equal((await mutate("terms", op, id, {})).ok, false);
  assert.deepEqual(calls, []);
});

test("read-only tables, mix create/delete, and invalid IDs cannot mutate", async () => {
  const { mutate, calls } = actionHarness();
  for (const op of ["create", "update", "delete"]) assert.equal((await mutate("llm-responses", op, id, {})).ok, false);
  for (const op of ["create", "delete"]) assert.equal((await mutate("prompt-chain-mix", op, id, {})).ok, false);
  assert.equal((await mutate("terms", "update", "invalid", {})).ok, false);
  assert.equal((await mutate("users", "delete", id, {})).ok, false);
  assert.deepEqual(calls, []);
});

test("each CRUD table creates, updates, and deletes through scoped queries", async () => {
  for (const section of sections.filter((s) => s.mode === "crud")) {
    const values = Object.fromEntries(section.fields.map((f) => [f.name, f.type === "boolean" ? true : f.type === "email" ? "test@example.com" : f.type === "domain" ? "example.com" : f.type === "number" ? "2048" : f.type === "url" ? "https://example.com/v1" : f.type === "provider" ? id : "test value"]));
    for (const op of ["create", "update", "delete"]) {
      const { mutate, calls } = actionHarness();
      assert.equal((await mutate(section.slug, op, op === "create" ? null : id, values)).ok, true);
      assert.deepEqual(calls[0], ["from", section.table]);
      assert.ok(calls.some((call) => call[0] === "revalidate"));
      if (op !== "create") assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "id" && call[2] === id));
      else { assert.match(calls[1][1].id, /^[a-f0-9-]{36}$/); assert.ok(calls[1][1].created_at); }
    }
  }
});

test("mix updates only allowed fields and server timestamp", async () => {
  const { mutate, calls } = actionHarness();
  assert.equal((await mutate("prompt-chain-mix", "update", id, { weight: "2.5", is_active: false })).ok, true);
  const payload = calls.find((call) => call[0] === "update")[1];
  assert.deepEqual(Object.keys(payload).sort(), ["is_active", "updated_at", "weight"]);
  assert.equal(payload.weight, 2.5);
});

test("database errors and zero affected rows never report success or leak details", async () => {
  for (const code of ["23505", "23503", "42501", "PGRST116"]) {
    const { mutate, calls } = actionHarness({ error: { code, message: "private database details" } });
    const result = await mutate("terms", "delete", id, null);
    assert.equal(result.ok, false);
    assert.equal(result.message, databaseMessage(code));
    assert.ok(!result.message.includes("private"));
    assert.ok(!calls.some((call) => call[0] === "revalidate"));
  }
});

// Exercise the actual component event handlers without a browser or live credentials.
function managerHarness(section, result = { ok: true, message: "Record deleted." }, deleted = false) {
  const states = [];
  let cursor = 0;
  const jobs = [];
  const calls = [];
  const navigation = [];
  const record = { id, term: "Test term", title: "Test example", name: "Test model", domain: "example.com", email: "test@example.com" };
  const Manager = load("components/admin/RecordsManager.tsx", {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value) => { states[index] = value; }];
      },
      useTransition: () => [false, (job) => jobs.push(job())],
    },
    "next/navigation": { useRouter: () => ({ replace: (url) => navigation.push(url) }) },
    "@/app/admin/actions": { mutateRecord: async (...args) => { calls.push(args); return result; } },
  }).default;
  return {
    calls, navigation, jobs, record,
    render: () => { cursor = 0; return Manager({ section, records: [record], providers: [], deleted }); },
  };
}

function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, predicate));
  if (!node || typeof node !== "object") return [];
  return [...(predicate(node) ? [node] : []), ...elements(node.props?.children, predicate)];
}

function content(node) {
  if (Array.isArray(node)) return node.map(content).join("");
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return content(node.props?.children);
}

function findButton(tree, name) {
  return elements(tree, (node) => node.type === "button" && content(node).startsWith(name))[0];
}

for (const section of sections.filter((s) => s.mode === "crud")) {
  test(`${section.slug}: visible row delete requires confirmation and returns to list`, async () => {
    const h = managerHarness(section);
    let tree = h.render();
    assert.ok(findButton(tree, "+ Create record"));
    assert.ok(findButton(tree, "Edit"));
    const firstCell = elements(tree, (node) => node.type === "td")[0];
    assert.match(firstCell.props.className, /sticky left-0/);
    findButton(firstCell, "Delete").props.onClick();
    assert.equal(h.calls.length, 0, "opening confirmation must not delete");
    tree = h.render();
    let confirmation = elements(tree, (node) => typeof node.type === "function" && node.props.onConfirm)[0];
    assert.equal(confirmation.props.record.id, id);
    confirmation.props.onCancel();
    assert.equal(h.calls.length, 0, "cancel must not delete");
    assert.equal(elements(h.render(), (node) => !!node.props?.onConfirm).length, 0);
    findButton(h.render(), "Delete").props.onClick();
    confirmation = elements(h.render(), (node) => !!node.props?.onConfirm)[0];
    confirmation.props.onConfirm();
    await Promise.all(h.jobs);
    assert.deepEqual(h.calls, [[section.slug, "delete", id, null]]);
    assert.deepEqual(h.navigation, [`/admin/${section.slug}?deleted=1`]);
    assert.match(content(h.render()), /Record deleted/);
    assert.match(content(managerHarness(section, undefined, true).render()), /Record deleted successfully/);
  });

  test(`${section.slug}: existing record editor exposes Delete but create form does not`, () => {
    const h = managerHarness(section);
    const originalWindow = globalThis.window;
    globalThis.window = { scrollTo() {} };
    try {
      findButton(h.render(), "Edit").props.onClick();
      let editor = elements(h.render(), (node) => node.props?.["aria-label"] === "Record editor")[0];
      assert.ok(findButton(editor, "Save record"));
      const deleteControl = findButton(editor, "Delete record");
      assert.equal(deleteControl.props.type, "button", "delete must not submit the edit form");
      deleteControl.props.onClick();
      const confirmation = elements(h.render(), (node) => !!node.props?.onConfirm)[0];
      assert.equal(confirmation.props.record.id, id);
      confirmation.props.onCancel();
      findButton(editor, "Cancel").props.onClick();
      findButton(h.render(), "+ Create record").props.onClick();
      editor = elements(h.render(), (node) => node.props?.["aria-label"] === "Record editor")[0];
      assert.equal(findButton(editor, "Delete record"), undefined);
    } finally {
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    }
  });
}

test("failed delete keeps confirmation and error visible without navigating", async () => {
  const h = managerHarness(getSection("terms"), { ok: false, message: "Database access was denied." });
  findButton(h.render(), "Delete").props.onClick();
  elements(h.render(), (node) => !!node.props?.onConfirm)[0].props.onConfirm();
  await Promise.all(h.jobs);
  const confirmation = elements(h.render(), (node) => !!node.props?.onConfirm)[0];
  assert.equal(confirmation.props.error, "Database access was denied.");
  assert.deepEqual(h.navigation, []);
});

test("read-only and mix views do not expose create or delete controls", () => {
  for (const section of sections.filter((s) => s.mode !== "crud")) {
    const tree = managerHarness(section).render();
    assert.equal(findButton(tree, "Delete"), undefined);
    assert.equal(findButton(tree, "+ Create"), undefined);
  }
});
