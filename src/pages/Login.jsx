import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00D084]">ContentAI</h1>
          <p className="text-[#888888] mt-2 text-sm">Generación de contenido con IA</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none focus:border-[#00D084] transition-colors"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none focus:border-[#00D084] transition-colors"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D084] text-black font-semibold py-3 rounded-lg hover:bg-[#00b870] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
