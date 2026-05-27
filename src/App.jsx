import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import SelectEmpresa from "./pages/SelectEmpresa";
import CrearContenido from "./pages/CrearContenido";
import Loader from "./components/Loader";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setSelectedEmpresa(null);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) return <Login />;

  if (selectedEmpresa) {
    return (
      <CrearContenido
        empresa={selectedEmpresa}
        onCambiarEmpresa={() => setSelectedEmpresa(null)}
      />
    );
  }

  return <SelectEmpresa onSelectEmpresa={setSelectedEmpresa} />;
}
