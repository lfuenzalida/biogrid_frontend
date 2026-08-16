const groupItems = [
  { label: "Flora", color: "#16a34a" },
  { label: "Fauna", color: "#0284c7" },
  { label: "Fungi", color: "#7c3aed" },
  { label: "Otros", color: "#d97706" },
  { label: "Sin clasificar", color: "#64748b" },
];

function LegendDot({ color, ring }: { color: string; ring?: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-3 w-3 shrink-0 rounded-full border-2 shadow-sm"
      style={{ backgroundColor: color, borderColor: ring ?? "#ffffff" }}
    />
  );
}

export function LeyendaAvistamientos() {
  return (
    <aside className="absolute bottom-4 left-4 z-10 hidden max-w-64 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm lg:block">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
        Grupos biológicos
      </h2>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {groupItems.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <LegendDot color={item.color} />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 text-[0.65rem] text-slate-500">
        <p className="flex items-center gap-1.5">
          <LegendDot color="#ffffff" ring="#064e3b" />
          Borde verde: área protegida
        </p>
        <p className="flex items-center gap-1.5">
          <LegendDot color="#ffffff" ring="#dc2626" />
          Borde rojo: especie amenazada
        </p>
        <p>Los círculos numerados agrupan registros cercanos.</p>
      </div>
    </aside>
  );
}
