// Lightweight, dependency-free SVG charts (self-contained, no external libs).

type TrendPoint = { label: string; deduct: number; add: number };
type BarRow = { label: string; value: number };

function niceMax(value: number) {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / pow) * pow;
}

/** Grouped monthly conduct trend: add vs deduct counts as a line chart. */
export function ConductTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 520;
  const H = 200;
  const padL = 32;
  const padB = 28;
  const padT = 12;
  const padR = 12;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = niceMax(
    Math.max(1, ...data.map((d) => Math.max(d.add, d.deduct))),
  );
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const x = (i: number) => padL + stepX * i;
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const line = (key: "add" | "deduct") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");

  const hasData = data.some((d) => d.add > 0 || d.deduct > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          แนวโน้มการบันทึกคะแนนความประพฤติ (12 เดือน)
        </h3>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> เพิ่ม
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500" /> ลด
          </span>
        </div>
      </div>
      {!hasData ? (
        <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full"
          role="img"
          aria-label="กราฟแนวโน้มการบันทึกคะแนนความประพฤติรายเดือน"
        >
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line
                x1={padL}
                x2={W - padR}
                y1={padT + innerH * t}
                y2={padT + innerH * t}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={padT + innerH * t + 4}
                textAnchor="end"
                className="fill-slate-400 text-[9px]"
              >
                {Math.round(max * (1 - t))}
              </text>
            </g>
          ))}
          <path d={line("add")} fill="none" stroke="#10b981" strokeWidth={2} />
          <path d={line("deduct")} fill="none" stroke="#ef4444" strokeWidth={2} />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(d.add)} r={2.5} fill="#10b981" />
              <circle cx={x(i)} cy={y(d.deduct)} r={2.5} fill="#ef4444" />
              {i % 2 === 0 && (
                <text
                  x={x(i)}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  {d.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Horizontal bar chart of per-room recycle points. */
export function RecycleBarChart({ data }: { data: BarRow[] }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        คะแนนขยะแลกแต้มรายห้อง (สูงสุด 8 ห้อง)
      </h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 truncate text-slate-600">
                {d.label}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-semibold text-emerald-700">
                {d.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
