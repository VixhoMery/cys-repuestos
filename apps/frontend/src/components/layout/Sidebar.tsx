import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'

import {
  Package,
  ShoppingCart,
  ReceiptText,
  ChartNoAxesCombined,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)

  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      to: '/productos',
      label: 'Productos',
      icon: Package,
    },
    {
      to: '/pos',
      label: 'Punto de Venta',
      icon: ShoppingCart,
    },
    {
      to: '/ventas',
      label: 'Ventas',
      icon: ReceiptText,
    },
    {
      to: '/estadisticas',
      label: 'Estadísticas',
      icon: ChartNoAxesCombined,
    },
  ]

  return (
    <aside
      className={`
        sticky top-0
        flex h-screen self-start flex-col
        overflow-y-auto
        bg-slate-900 text-white
        transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Encabezado */}
      <div
        className={`
          flex items-center
          border-b border-slate-700
          p-4
          ${isOpen ? 'justify-between' : 'justify-center'}
        `}
      >
        {isOpen && (
          <div>
            <h1 className="text-xl font-bold">
              C&S Repuestos
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Sistema de gestión
            </p>
          </div>
        )}

        {/* Este botón SOLO abre/cierra el sidebar */}
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="
            rounded-lg p-2
            text-slate-300
            transition
            hover:bg-slate-800
            hover:text-white
          "
          aria-label={
            isOpen
              ? 'Contraer menú'
              : 'Expandir menú'
          }
        >
          {isOpen ? (
            <ChevronLeft size={22} />
          ) : (
            <ChevronRight size={22} />
          )}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isOpen ? item.label : undefined}
              className={({ isActive }) =>
                `
                  flex items-center gap-3
                  rounded-lg px-4 py-3
                  transition-colors duration-200

                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }

                  ${!isOpen ? 'justify-center' : ''}
                `
              }
            >
              <Icon
                size={22}
                className="shrink-0"
              />

              {isOpen && (
                <span className="whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700 p-4">
        <button
          type="button"
          onClick={handleLogout}
          title={!isOpen ? 'Cerrar sesión' : undefined}
          className={`
            flex w-full items-center gap-3
            rounded-lg px-4 py-3
            text-slate-300
            transition-colors duration-200
            hover:bg-red-500/10
            hover:text-red-400

            ${!isOpen ? 'justify-center' : ''}
          `}
        >
          <LogOut
            size={22}
            className="shrink-0"
          />

          {isOpen && (
            <span className="whitespace-nowrap">
              Cerrar sesión
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar