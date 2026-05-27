import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Loader from "../components/Loader";

const REDES = ["Instagram", "Facebook", "LinkedIn", "TikTok"];

const SYSTEM_PROMPT =
  "Eres un estratega creativo de contenido para redes sociales. Tu trabajo es ayudar al usuario a refinar su idea para crear contenido visual impactante. Haz máximo 2 preguntas cortas y concretas para entender mejor la idea. Cuando tengas suficiente contexto, di 'IDEA LISTA:' seguido de un resumen conciso de la idea refinada lista para generar. Sé directo y conciso.";

const ACTION_BUTTONS = [
  { icon: "✏️", label: "Editar", tooltip: "Modifica elementos específicos" },
  { icon: "📝", label: "Layerize", tooltip: "Extrae el texto para editarlo" },
  { icon: "⬇️", label: "Descargar", tooltip: "Guarda la imagen" },
  { icon: "🔄", label: "Nueva", tooltip: "Genera una variación" },
];

export default function CrearContenido({ empresa, onCambiarEmpresa }) {
  const [redSocial, setRedSocial] = useState("Instagram");
  const [idea, setIdea] = useState("");

  // Chat de refinamiento
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Generación
  const [generando, setGenerando] = useState(false);
  const [imagenUrl, setImagenUrl] = useState(null);

  // Panel de edición
  const [showEdit, setShowEdit] = useState(false);
  const [editTexto, setEditTexto] = useState("");
  const [editando, setEditando] = useState(false);

  // Panel de layerize
  const [showLayerize, setShowLayerize] = useState(false);
  const [layerizando, setLayerizando] = useState(false);
  const [layerizeResult, setLayerizeResult] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // --- Claude API ---
  const callClaude = async (messages) => {
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-allow-browser": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });
      const data = await res.json();
      const assistantText = data.content[0].text;
      const updated = [...messages, { role: "assistant", content: assistantText }];
      setChatMessages(updated);

      if (assistantText.includes("IDEA LISTA:")) {
        const ideaRefinada = assistantText.split("IDEA LISTA:")[1].trim();
        setTimeout(() => {
          setIdea(ideaRefinada);
          setShowChat(false);
          setChatMessages([]);
        }, 1500);
      }
    } catch (err) {
      console.error("Error Claude API:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRefinarIdea = async () => {
    const initialMsg = idea.trim()
      ? `Quiero crear contenido para ${redSocial}. Mi idea: ${idea}`
      : `Quiero crear contenido para ${redSocial}. No tengo idea definida, ayúdame a definir una.`;
    const messages = [{ role: "user", content: initialMsg }];
    setChatMessages(messages);
    setShowChat(true);
    await callClaude(messages);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const updated = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(updated);
    setChatInput("");
    await callClaude(updated);
  };

  // --- Webhook n8n ---
  const callWebhook = async (accion, ideaPayload) => {
    const res = await fetch(import.meta.env.VITE_N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa_id: empresa.id,
        red_social: redSocial,
        idea: ideaPayload ?? idea,
        accion,
        imagen_url: imagenUrl || "",
      }),
    });
    return res.json();
  };

  const handleGenerarContenido = async () => {
    setGenerando(true);
    setShowEdit(false);
    setShowLayerize(false);
    setLayerizeResult(null);
    try {
      const data = await callWebhook("generar");
      setImagenUrl(data.imagen_url);
    } catch (err) {
      console.error("Error generando:", err);
    } finally {
      setGenerando(false);
    }
  };

  const handleGenerarDesdeChat = () => {
    setShowChat(false);
    handleGenerarContenido();
  };

  const handleEditar = async () => {
    if (!editTexto.trim()) return;
    setEditando(true);
    try {
      const data = await callWebhook("editar", editTexto);
      setImagenUrl(data.imagen_url);
      setShowEdit(false);
      setEditTexto("");
    } catch (err) {
      console.error("Error editando:", err);
    } finally {
      setEditando(false);
    }
  };

  const handleLayerize = async () => {
    setLayerizando(true);
    try {
      const data = await callWebhook("layerize");
      setLayerizeResult(data);
      if (data.base_image_url) setImagenUrl(data.base_image_url);
    } catch (err) {
      console.error("Error en layerize:", err);
    } finally {
      setLayerizando(false);
    }
  };

  const handleDescargar = () => {
    const link = document.createElement("a");
    link.href = imagenUrl;
    link.download = `contentai-${Date.now()}.png`;
    link.click();
  };

  const handleActionClick = (label) => {
    switch (label) {
      case "Editar":
        setShowEdit(!showEdit);
        setShowLayerize(false);
        break;
      case "Layerize":
        setShowLayerize(!showLayerize);
        setShowEdit(false);
        break;
      case "Descargar":
        handleDescargar();
        break;
      case "Nueva":
        handleGenerarContenido();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-[#2A2A2A] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <span className="text-[#00D084] font-bold text-lg flex-shrink-0">ContentAI</span>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#00D084] flex-shrink-0" />
          <span className="text-white text-sm font-medium truncate">{empresa.nombre}</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <button
            onClick={onCambiarEmpresa}
            className="text-[#888888] text-sm hover:text-white transition-colors whitespace-nowrap"
          >
            Cambiar empresa
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-[#888888] text-sm hover:text-white transition-colors whitespace-nowrap"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main — dos columnas */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Columna izquierda: Panel de creación ── */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Crear contenido</h2>
              <p className="text-[#888888] text-sm mt-1">
                Genera piezas visuales para redes sociales con IA en segundos
              </p>
            </div>

            {/* Pills de red social */}
            <div>
              <p className="text-xs text-[#888888] mb-3 uppercase tracking-wider">Red social</p>
              <div className="flex flex-wrap gap-2">
                {REDES.map((red) => (
                  <button
                    key={red}
                    onClick={() => setRedSocial(red)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      redSocial === red
                        ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]"
                        : "bg-[#1A1A1A] text-[#888888] border border-[#2A2A2A] hover:border-[#444444] hover:text-white"
                    }`}
                  >
                    {red}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea de idea */}
            <div>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe tu idea o déjalo vacío para que la IA proponga algo..."
                rows={5}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none focus:border-[#00D084] transition-colors resize-none"
              />
              <p className="text-[#888888] text-xs mt-2">
                💡 La IA usará el contexto de tu marca para crear contenido alineado a tu identidad
              </p>
            </div>

            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefinarIdea}
                disabled={chatLoading || generando}
                className="flex-1 py-3 px-4 rounded-lg border border-[#00D084] text-[#00D084] text-sm font-medium hover:bg-[#00D084]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ✨ Refinar idea con IA
              </button>
              <button
                onClick={handleGenerarContenido}
                disabled={generando || chatLoading}
                className="flex-1 py-3 px-4 rounded-lg bg-[#00D084] text-black text-sm font-semibold hover:bg-[#00b870] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                🚀 Generar contenido
              </button>
            </div>

            {/* Mini chat de refinamiento */}
            {showChat && (
              <div className="bg-[#1A1A1A] border border-[#00D084]/40 rounded-xl p-4 flex flex-col gap-4">
                <p className="text-sm font-medium text-white">💬 Refinando tu idea...</p>

                {/* Historial de mensajes */}
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#00D084]/20 text-white border border-[#00D084]/30"
                            : "bg-[#2A2A2A] text-[#E0E0E0]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#2A2A2A] px-4 py-3 rounded-lg">
                        <Loader />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Tu respuesta..."
                    disabled={chatLoading}
                    className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-[#888888] text-sm focus:outline-none focus:border-[#00D084] disabled:opacity-50 transition-colors"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-2 bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40 rounded-lg text-sm hover:bg-[#00D084]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Enviar
                  </button>
                </div>

                <button
                  onClick={handleGenerarDesdeChat}
                  disabled={generando}
                  className="w-full py-2.5 bg-[#00D084] text-black text-sm font-semibold rounded-lg hover:bg-[#00b870] disabled:opacity-40 transition-colors"
                >
                  ✨ Generar con esta idea
                </button>
              </div>
            )}
          </div>

          {/* ── Columna derecha: Resultado ── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white">Resultado</h2>

            {/* Área de resultado */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden min-h-64">
              {generando ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader />
                  <p className="text-white text-sm font-medium">Generando tu contenido con IA...</p>
                  <p className="text-[#888888] text-xs">Esto puede tomar 20-30 segundos</p>
                </div>
              ) : imagenUrl ? (
                <img
                  src={imagenUrl}
                  alt="Contenido generado"
                  className="w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 gap-3 px-8">
                  <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#444444]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-[#888888] text-sm">Tu imagen aparecerá aquí</p>
                  <p className="text-[#555555] text-xs text-center leading-relaxed">
                    Selecciona una red social, escribe tu idea y presiona Generar
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 p-3 bg-[#0D0D0D] rounded-xl">
              {ACTION_BUTTONS.map(({ icon, label, tooltip }) => {
                const enabled = !!imagenUrl && !generando;
                return (
                  <button
                    key={label}
                    onClick={() => handleActionClick(label)}
                    disabled={!enabled}
                    title={tooltip}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      enabled
                        ? "bg-[#1A1A1A] border-[#2A2A2A] text-white hover:border-[#00D084] cursor-pointer"
                        : "bg-[#1A1A1A] border-[#2A2A2A] text-white opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel de edición */}
            {showEdit && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-3">
                <textarea
                  value={editTexto}
                  onChange={(e) => setEditTexto(e.target.value)}
                  placeholder="¿Qué quieres cambiar?"
                  rows={3}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white placeholder-[#888888] text-sm focus:outline-none focus:border-[#00D084] transition-colors resize-none"
                />
                {editando ? (
                  <div className="flex justify-center py-2">
                    <Loader text="Aplicando edición..." />
                  </div>
                ) : (
                  <button
                    onClick={handleEditar}
                    disabled={!editTexto.trim()}
                    className="w-full py-2.5 bg-[#00D084] text-black text-sm font-semibold rounded-lg hover:bg-[#00b870] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Aplicar edición
                  </button>
                )}
              </div>
            )}

            {/* Panel de layerize */}
            {showLayerize && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-3">
                {layerizando ? (
                  <div className="flex justify-center py-4">
                    <Loader text="Extrayendo texto de la imagen..." />
                  </div>
                ) : layerizeResult ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-[#888888]">
                      {layerizeResult.text_blocks?.length ?? 0} bloques de texto detectados
                    </p>
                    <div className="flex flex-col gap-2">
                      {layerizeResult.text_blocks?.map((block, i) => (
                        <div
                          key={i}
                          className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2"
                        >
                          <p className="text-white text-sm">{block.text}</p>
                          {block.font_size && (
                            <p className="text-[#888888] text-xs mt-0.5">{block.font_size}px</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[#888888] text-sm leading-relaxed">
                      Layerize detectará el texto de tu imagen y te devolverá el fondo limpio + información de cada bloque de texto
                    </p>
                    <button
                      onClick={handleLayerize}
                      className="w-full py-2.5 bg-[#00D084] text-black text-sm font-semibold rounded-lg hover:bg-[#00b870] transition-colors"
                    >
                      Extraer texto
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
