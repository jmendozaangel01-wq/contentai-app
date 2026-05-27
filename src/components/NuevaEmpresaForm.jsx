import { useState, useRef } from "react";
import Loader from "./Loader";

const WEBHOOK_URL = "https://n8n.srv1587395.hstgr.cloud/webhook/onboarding-empresa";

export default function NuevaEmpresaForm({ onEmpresaCreated }) {
  const [nombre, setNombre] = useState("");
  const [contexto, setContexto] = useState("");
  const [pdf, setPdf] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") setPdf(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("nombre_empresa", nombre.trim());
    if (pdf) formData.append("pdf_file", pdf);
    if (contexto.trim()) formData.append("contexto_adicional", contexto.trim());

    try {
      const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setNombre("");
        setContexto("");
        setPdf(null);
        onEmpresaCreated?.();
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Error al registrar la empresa");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Nombre de la empresa"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none focus:border-[#00D084] transition-colors"
      />

      <textarea
        placeholder="Información adicional (opcional) — pega aquí info de la empresa"
        value={contexto}
        onChange={(e) => setContexto(e.target.value)}
        rows={3}
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none focus:border-[#00D084] transition-colors resize-none"
      />

      {/* Zona drag & drop PDF */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-[#00D084] bg-[#00D084]/5"
            : "border-[#2A2A2A] hover:border-[#444444]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setPdf(e.target.files[0] || null)}
        />
        {pdf ? (
          <p className="text-[#00D084] text-sm">📄 {pdf.name}</p>
        ) : (
          <p className="text-[#888888] text-sm">
            Arrastra tu PDF aquí o haz clic para seleccionar
          </p>
        )}
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-2">
          <Loader text="Analizando empresa con IA..." />
        </div>
      )}

      {status === "success" && (
        <p className="text-[#00D084] text-sm text-center">
          ✅ ¡Empresa registrada! Actualizando lista...
        </p>
      )}

      {status === "error" && (
        <p className="text-red-400 text-sm text-center">{errorMsg}</p>
      )}

      {status === "idle" && (
        <button
          type="submit"
          disabled={!nombre.trim()}
          className="w-full bg-[#00D084] text-black font-semibold py-3 rounded-lg hover:bg-[#00b870] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Analizar y registrar empresa
        </button>
      )}
    </form>
  );
}
