import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import EmpresaCard from "../components/EmpresaCard";
import NuevaEmpresaForm from "../components/NuevaEmpresaForm";
import Loader from "../components/Loader";

const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/empresas?select=id,nombre,created_at&order=created_at.desc`;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export default function SelectEmpresa() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const res = await fetch(SUPABASE_URL, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      const data = await res.json();
      setEmpresas(data);
    } catch (err) {
      console.error("Error cargando empresas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmpresas(); }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Navbar */}
      <nav className="border-b border-[#2A2A2A] px-6 py-4 flex items-center justify-between">
        <span className="text-[#00D084] font-bold text-lg">ContentAI</span>
        <button
          onClick={() => signOut(auth)}
          className="text-[#888888] text-sm hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-white">
          ¿Para qué empresa vamos a crear contenido?
        </h2>
        <p className="text-[#888888] mt-1 mb-8 text-sm">
          Selecciona una empresa existente o registra una nueva
        </p>

        {/* Feedback empresa seleccionada */}
        {selected && (
          <div className="mb-6 p-4 bg-[#00D084]/10 border border-[#00D084]/30 rounded-lg">
            <p className="text-[#00D084] text-sm">
              ✅ Empresa seleccionada: <strong>{selected.nombre}</strong> — Continuando...
            </p>
          </div>
        )}

        {/* Lista de empresas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader text="Cargando empresas..." />
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-10">
            {empresas.length === 0 ? (
              <p className="text-[#888888] text-sm text-center py-8">
                No hay empresas registradas aún
              </p>
            ) : (
              empresas.map((empresa) => (
                <EmpresaCard
                  key={empresa.id}
                  empresa={empresa}
                  onSelect={setSelected}
                />
              ))
            )}
          </div>
        )}

        {/* Separador */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#2A2A2A]" />
          <span className="text-[#888888] text-sm whitespace-nowrap">
            — o registra una nueva empresa —
          </span>
          <div className="flex-1 h-px bg-[#2A2A2A]" />
        </div>

        {/* Formulario nueva empresa */}
        <NuevaEmpresaForm onEmpresaCreated={fetchEmpresas} />
      </main>
    </div>
  );
}
