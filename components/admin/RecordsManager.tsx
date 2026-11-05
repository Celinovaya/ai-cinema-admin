"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mutateRecord } from "@/app/admin/actions";
import { labelFor, type Section, type AdminRecord, type ProviderOption } from "@/lib/admin/sections";

const button = "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50";
const inputClass = "w-full rounded-xl border border-white/15 bg-[#08111d] px-4 py-3 text-white outline-none focus:border-cyan-400";
const deleteButton = "rounded-lg border border-red-400/50 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/30 focus-visible:outline-2 focus-visible:outline-red-300 disabled:cursor-wait disabled:opacity-50";

function DeleteConfirmation({ record, pending, error, onConfirm, onCancel }: {
  record: AdminRecord;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const name = record.term ?? record.title ?? record.name ?? record.domain ?? record.email ?? record.id;
  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }} aria-labelledby="delete-title" aria-describedby="delete-description" className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-red-400/30 bg-[#091522] p-6 text-white shadow-2xl backdrop:bg-black/70">
    <h2 id="delete-title" className="text-xl font-bold text-red-200">Delete this record?</h2>
    <p id="delete-description" className="my-4 break-words text-slate-300">Delete “{String(name)}”? This permanently removes the selected record and cannot be undone.</p>
    <p className="mb-5 break-all font-mono text-xs text-slate-400">ID: {record.id}</p>
    {error && <p role="alert" className="mb-5 text-red-200">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" autoFocus disabled={pending} onClick={onCancel} className={button}>Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className={deleteButton}>{pending ? "Deleting…" : "Confirm delete"}</button></div>
  </dialog>;
}

function RecordValue({ value }: { value: AdminRecord[string] }) {
  if (value === null || value === "") return <span className="text-slate-500">—</span>;
  if (typeof value === "boolean") return <span className={value ? "text-emerald-300" : "text-slate-400"}>{value ? "Yes" : "No"}</span>;
  const text = String(value);
  if (text.length > 180) return <details><summary className="cursor-pointer text-cyan-300">{text.slice(0, 100)}… · View full text</summary><p className="mt-3 whitespace-pre-wrap break-words">{text}</p></details>;
  return <span className="whitespace-pre-wrap break-words">{text}</span>;
}

export default function RecordsManager({ section, records, providers, providerError, deleted = false }: {
  section: Section; records: AdminRecord[]; providers: ProviderOption[]; providerError?: string; deleted?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminRecord | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(deleted ? { ok: true, message: "Record deleted successfully." } : null);
  const [pending, startTransition] = useTransition();

  function confirmDeletion(record: AdminRecord) {
    setNotice(null);
    setDeleting(record);
  }

  function submit(formData: FormData) {
    if (!editing || pending) return;
    const values = Object.fromEntries(section.fields.map((field) => [field.name, field.type === "boolean" ? formData.get(field.name) === "on" : String(formData.get(field.name) ?? "")]));
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await mutateRecord(section.slug, editing === "new" ? "create" : "update", editing === "new" ? null : editing.id, values);
        setNotice(result);
        if (result.ok) setEditing(null);
      } catch { setNotice({ ok: false, message: "The request could not complete. Your form is preserved; please retry." }); }
    });
  }

  function remove() {
    if (!deleting || pending) return;
    startTransition(async () => {
      try {
        const result = await mutateRecord(section.slug, "delete", deleting.id, null);
        setNotice(result);
        if (result.ok) {
          setDeleting(null);
          setEditing(null);
          // Carry the success notice through the remount when deleting from a later page.
          router.replace(`/admin/${section.slug}?deleted=1`);
        }
      } catch { setNotice({ ok: false, message: "Delete could not complete. Please retry." }); }
    });
  }

  const formsDisabled = pending || (!!providerError && section.slug === "llm-models");
  return <div className="space-y-6" aria-busy={pending}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-400">{records.length} records on this page · {section.mode === "read" ? "Read only" : section.mode === "update" ? "Weight and active status only" : "Create, read, update & delete"}</p>
      {section.mode === "crud" && <button className={`${button} text-cyan-300`} disabled={pending || !!editing || !!deleting} onClick={() => { setEditing("new"); setNotice(null); }}>+ Create record</button>}
    </div>
    {providerError && <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-amber-200">{providerError} Reload this page to retry loading providers before saving models.</p>}
    {notice && <p role={notice.ok ? "status" : "alert"} className={`rounded-xl border p-4 ${notice.ok ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200" : "border-red-400/20 bg-red-400/5 text-red-200"}`}>{notice.message}</p>}
    {editing && <section aria-label="Record editor" className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.07] to-cyan-500/[0.03] p-6">
      <h2 className="text-xl font-bold">{editing === "new" ? "Create record" : "Edit record"}</h2>
      <p className="mt-2 text-sm text-slate-400">Required fields are marked *. {editing !== "new" && `Record: ${editing.id}`}</p>
      <form onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }} key={editing === "new" ? "new" : editing.id} className="mt-6 space-y-5">
        <fieldset disabled={formsDisabled} className="space-y-5 disabled:opacity-60">
          {section.fields.map((field) => {
            const value = editing === "new" ? field.defaultValue ?? "" : editing[field.name] ?? "";
            const id = `field-${field.name}`;
            if (field.type === "boolean") return <label key={field.name} htmlFor={id} className="flex items-center gap-3 text-sm font-semibold text-slate-200"><input id={id} name={field.name} type="checkbox" defaultChecked={value === true} className="h-5 w-5 accent-cyan-400" />{field.label}</label>;
            return <div key={field.name}>
              <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-300">{field.label}{field.required ? " *" : " (optional)"}</label>
              {field.type === "textarea" ? <textarea id={id} name={field.name} rows={5} required={field.required} maxLength={100000} defaultValue={String(value)} className={inputClass} /> : field.type === "provider" ?
                <select id={id} name={field.name} defaultValue={String(value)} className={inputClass}><option value="">No provider</option>{value && !providers.some((provider) => provider.id === value) && <option value={String(value)}>Current provider ({String(value)})</option>}{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select> :
                <input id={id} name={field.name} type={["number", "email", "url"].includes(field.type) ? field.type : "text"} required={field.required} min={field.min} max={field.max} step={field.step} maxLength={100000} defaultValue={String(value)} placeholder={field.type === "domain" ? "example.com" : undefined} className={inputClass} />}
            </div>;
          })}
        </fieldset>
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={formsDisabled} className={`${button} bg-cyan-500/20 text-cyan-200`}>{pending ? "Saving…" : "Save record"}</button><button type="button" disabled={pending} onClick={() => setEditing(null)} className={button}>Cancel</button>{section.mode === "crud" && editing !== "new" && <button type="button" disabled={pending} onClick={() => confirmDeletion(editing)} className={`${deleteButton} sm:ml-auto`}>Delete record</button>}</div>
      </form>
    </section>}
    {deleting && <DeleteConfirmation record={deleting} pending={pending} error={notice && !notice.ok ? notice.message : undefined} onConfirm={remove} onCancel={() => { setDeleting(null); setNotice(null); }} />}
    {records.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center text-slate-400">No records found on this page.{section.mode === "crud" ? " Create a record to get started." : " Records will appear here when they are available."}</div> :
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035]">
        <table className="w-full text-left text-sm"><caption className="sr-only">{section.title} records</caption><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase text-slate-400"><tr>{section.mode !== "read" && <th scope="col" className="sticky left-0 z-10 bg-[#102031] px-4 py-4">Actions</th>}{section.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-5 py-4">{labelFor(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-white/10">{records.map((record) => <tr key={record.id} className="align-top hover:bg-white/[0.025]">
            {section.mode !== "read" && <td className="sticky left-0 z-10 bg-[#091522] px-4 py-4"><div className="flex flex-col gap-2"><button disabled={pending || !!editing || !!deleting} className={`${button} text-cyan-300`} onClick={() => { setEditing(record); setNotice(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit<span className="sr-only"> record {record.id}</span></button>{section.mode === "crud" && <button disabled={pending || !!deleting} className={deleteButton} onClick={() => confirmDeletion(record)}>Delete<span className="sr-only"> record {record.id}</span></button>}</div></td>}
            {section.columns.map((column) => <td key={column} className="min-w-36 max-w-lg px-5 py-4 text-slate-300"><RecordValue value={record[column]} />{column === "provider_id" && providers.some((provider) => provider.id === record[column]) && <p className="mt-2 text-cyan-300">{providers.find((provider) => provider.id === record[column])?.name}</p>}</td>)}
          </tr>)}</tbody>
        </table>
      </div>}
  </div>;
}
