import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import logo from "../../assets/logo.png";

import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    const result = await login(email, password);

    setLoading(false);

    if (result.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    navigate("/productos");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div
        className="
    w-full max-w-md
    rounded-3xl
    border border-slate-200
    bg-white
    p-8
    shadow-lg
    shadow-slate-200/50
  "
      >
        <div className="mb-8 text-center">
          {/* Logo */}
          <div
            className="
      mx-auto mb-5
      flex h-24 w-24
      items-center justify-center
      overflow-hidden
      rounded-2xl
      bg-white
      p-2
    "
          >
            <img
              src={logo}
              alt="Logo C&S Repuestos"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">C&S Repuestos</h1>

          <p className="mt-2 text-slate-500">Sistema de gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="
              flex w-full items-center
              justify-center gap-2
              rounded-xl
              bg-blue-600
              px-5 py-3
              font-medium text-white
              transition
              hover:bg-blue-700
              disabled:opacity-50
            "
          >
            <LogIn size={18} />

            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
