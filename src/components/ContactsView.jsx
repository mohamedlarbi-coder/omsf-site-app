import React, { useState } from "react";
import { ChevronLeft, Plus, Trash2, Building2, Mail, Check } from "lucide-react";

function SubcontractorEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [emails, setEmails] = useState((initial?.contact_emails || []).join(", "));

  function handleSave() {
    if (!name.trim()) return;
    const emailList = emails.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
    onSave(name.trim(), emailList);
  }

  return (
    <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Subcontractor / Company Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. GIP"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact Emails</span>
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="contact1@gip.com, contact2@gip.com"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-[#050b14] px-3 py-2.5 text-[15px] text-white placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
        />
      </label>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 bg-stone-800 hover:bg-stone-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
          <Check size={16} /> Save
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ContactsView({ subcontractors, addSubcontractor, updateSubcontractor, deleteSubcontractor, setView }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="min-h-screen bg-[#050b14] font-sans">
      <div className="max-w-md mx-auto pb-10">
        <header className="sticky top-0 bg-[#0b1522] border-b border-slate-800 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView("settings")} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-800 text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-white">Subcontractor Contacts</h1>
        </header>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            Add each subcontractor's contact emails here. When you select their name as "Report To" on a report, they'll automatically be added to the email — in addition to your base distribution list.
          </p>

          {adding && (
            <SubcontractorEditor
              onSave={(name, emails) => { addSubcontractor(name, emails); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          )}

          {subcontractors.length === 0 && !adding && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Building2 size={28} className="text-slate-500" />
              </div>
              <h3 className="font-semibold text-slate-200 mb-1">No contacts yet</h3>
              <p className="text-sm text-slate-500">Add a subcontractor to start routing reports to them automatically.</p>
            </div>
          )}

          <div className="space-y-3">
            {subcontractors.map((s) =>
              editingId === s.id ? (
                <SubcontractorEditor
                  key={s.id}
                  initial={s}
                  onSave={(name, emails) => { updateSubcontractor(s.id, { name, contact_emails: emails }); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={s.id} className="bg-[#0b1522] rounded-xl border border-slate-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <Building2 size={16} className="text-teal-400" /> {s.name}
                      </div>
                      <div className="mt-2 space-y-1">
                        {(s.contact_emails || []).length === 0 ? (
                          <p className="text-xs text-slate-500">No emails added</p>
                        ) : (
                          s.contact_emails.map((e) => (
                            <div key={e} className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Mail size={12} /> {e}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingId(s.id)} className="text-slate-500 hover:text-slate-200 p-1.5">
                        <Building2 size={16} />
                      </button>
                      <button onClick={() => deleteSubcontractor(s.id)} className="text-red-400 hover:text-red-500 p-1.5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 text-slate-400 font-semibold py-3 rounded-xl hover:border-teal-400 hover:text-teal-400 transition-colors"
            >
              <Plus size={18} /> Add Subcontractor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
