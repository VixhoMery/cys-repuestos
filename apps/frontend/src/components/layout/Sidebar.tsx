import { useState } from "react";
import { NavLink } from "react-router";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

import {
  Package,
  ShoppingCart,
  ReceiptText,
  ChartNoAxesCombined,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `
      flex items-center gap-3 rounded-lg px-4 py-3
      transition-colors duration-200
      ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }
    `;

  return (
    <aside
      className={`
        sticky top-0
        flex h-screen self-start flex-col
        bg-slate-900 text-white
        transition-all duration-300
        ${isOpen ? "w-64" : "w-20"}
    `}
    >
      {/* Encabezado */}
      <div
        className={`
          flex items-center border-b border-slate-700 p-4
          ${isOpen ? "justify-between" : "justify-center"}
        `}
      >
        {isOpen && (
          <div>
            <h1 className="text-xl font-bold">C&S Repuestos</h1>

            <p className="text-sm text-slate-400">Sistema de gestión</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="
            flex w-full items-center gap-3
            rounded-lg px-4 py-3
            text-slate-300
            transition
            hover:bg-slate-800
            hover:text-white
          ">
            
          <LogOut size={22} />

          {isOpen && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-2 p-4">
        <NavLink
          to="/productos"
          className={linkClass}
          title={!isOpen ? "Productos" : undefined}
        >
          <Package size={22} />

          {isOpen && <span>Productos</span>}
        </NavLink>

        <NavLink
          to="/pos"
          className={linkClass}
          title={!isOpen ? "Punto de Venta" : undefined}
        >
          <ShoppingCart size={22} />

          {isOpen && <span>Punto de Venta</span>}
        </NavLink>

        <NavLink
          to="/ventas"
          className={linkClass}
          title={!isOpen ? "Ventas" : undefined}
        >
          <ReceiptText size={22} />

          {isOpen && <span>Ventas</span>}
        </NavLink>

        <NavLink
          to="/estadisticas"
          className={linkClass}
          title={!isOpen ? "Estadísticas" : undefined}
        >
          <ChartNoAxesCombined size={22} />

          {isOpen && <span>Estadísticas</span>}
        </NavLink>
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-slate-700 p-4">
        <button
          type="button"
          className="
            flex w-full items-center gap-3
            rounded-lg px-4 py-3
            text-slate-300
            transition-colors duration-200
            hover:bg-slate-800 hover:text-white
          "
          title={!isOpen ? "Cerrar sesión" : undefined}
        >
          <LogOut size={22} />

          {isOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
