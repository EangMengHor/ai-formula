import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// Expandable Section Component
export function ExpandableSection({ title, count, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-200">{title}</h3>
          {count !== undefined && (
            <span className="text-sm text-slate-500 bg-slate-800 px-2 py-1 rounded">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-950/50">
          {children}
        </div>
      )}
    </div>
  );
}

// Summary Card Component
export function SummaryCard({ title, summary }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h4 className="mb-2 text-sm font-medium text-slate-300">{title}</h4>
      <p className="text-sm leading-relaxed text-slate-400">{summary}</p>
    </div>
  );
}

// Stats Grid Component
export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center"
        >
          <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
          <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Data Table Component
export function DataTable({ columns, data, rowKey = "id" }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6 text-center">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold text-slate-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] || idx}
              className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={`${col.key}-${idx}`}
                  className="px-4 py-3 text-slate-400"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Data List Component
export function DataList({ items, renderItem }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6 text-center">
        <p className="text-slate-500">No items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 hover:bg-slate-800/30 transition-colors"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Badge Component
export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-700 text-slate-200",
    success: "bg-green-900/30 text-green-300 border border-green-800",
    warning: "bg-yellow-900/30 text-yellow-300 border border-yellow-800",
    danger: "bg-red-900/30 text-red-300 border border-red-800",
    info: "bg-blue-900/30 text-blue-300 border border-blue-800",
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// No Data Component
export function NoDataFound() {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/20 p-8 text-center">
      <p className="text-slate-500">No data found for this category</p>
    </div>
  );
}
