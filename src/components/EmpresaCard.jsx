export default function EmpresaCard({ empresa, onSelect }) {
  const fecha = new Date(empresa.created_at).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={() => onSelect(empresa)}
      className="w-full flex items-center gap-4 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:border-[#00D084] transition-colors cursor-pointer text-left"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-[#00D084] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{empresa.nombre}</p>
        <p className="text-[#888888] text-xs mt-0.5">{fecha}</p>
      </div>
    </button>
  );
}
