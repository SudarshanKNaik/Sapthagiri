import React from "react";

export default function ScholarshipComparisonTable({ schemes = [] }) {
  if (!schemes.length) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-700">Field</th>
            {schemes.map((s) => (
              <th key={s.id} className="px-4 py-3 font-semibold text-slate-900">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-4 py-3 font-semibold text-slate-700">Income limit</td>
            {schemes.map((s) => (
              <td key={s.id} className="px-4 py-3">₹{s.income_limit}</td>
            ))}
          </tr>
          <tr className="border-t">
            <td className="px-4 py-3 font-semibold text-slate-700">Min marks</td>
            {schemes.map((s) => (
              <td key={s.id} className="px-4 py-3">{s.min_marks}%</td>
            ))}
          </tr>
          <tr className="border-t">
            <td className="px-4 py-3 font-semibold text-slate-700">Deadline</td>
            {schemes.map((s) => (
              <td key={s.id} className="px-4 py-3">{s.deadline}</td>
            ))}
          </tr>
          <tr className="border-t">
            <td className="px-4 py-3 font-semibold text-slate-700">Documents</td>
            {schemes.map((s) => (
              <td key={s.id} className="px-4 py-3">{(s.required_documents || []).join(", ")}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
