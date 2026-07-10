"use client";

interface SummaryBarProps {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

interface StatProps {
  label: string;
  value: string;
  color?: string;
  dimColor?: string;
  delay?: string;
}

function Stat({ label, value, color, dimColor, delay = "0s" }: StatProps) {
  return (
    <div
      className="flex-1 min-w-[130px] px-6 py-5 flex flex-col gap-1 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <p
        className="text-xs uppercase tracking-widest font-medium"
        style={{ color: "var(--muted)", letterSpacing: "0.08em" }}
      >
        {label}
      </p>
      <p
        className="font-mono tabular text-3xl font-semibold leading-none"
        style={{ color: color ?? "var(--ink)" }}
      >
        {value}
      </p>
      {dimColor && (
        <div
          className="mt-1 h-0.5 rounded-full w-8"
          style={{ background: dimColor }}
        />
      )}
    </div>
  );
}

export default function SummaryBar({ totalRows, totalImported, totalSkipped }: SummaryBarProps) {
  const rate = totalRows > 0 ? ((totalImported / totalRows) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="glass rounded-2xl flex flex-wrap overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Accent top line */}
      <div
        className="w-full h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--accent) 30%, rgba(200,169,110,0.3) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      <div className="flex flex-wrap w-full divide-x divide-white/5">
        <Stat
          label="Processed"
          value={totalRows.toLocaleString()}
          delay="0s"
        />
        <Stat
          label="Imported"
          value={totalImported.toLocaleString()}
          color="var(--success)"
          dimColor="var(--success)"
          delay="0.06s"
        />
        <Stat
          label="Skipped"
          value={totalSkipped.toLocaleString()}
          color={totalSkipped > 0 ? "var(--warning)" : "var(--muted)"}
          dimColor={totalSkipped > 0 ? "var(--warning)" : undefined}
          delay="0.12s"
        />
        <Stat
          label="Import Rate"
          value={`${rate}%`}
          color="var(--accent)"
          dimColor="var(--accent)"
          delay="0.18s"
        />
      </div>
    </div>
  );
}
