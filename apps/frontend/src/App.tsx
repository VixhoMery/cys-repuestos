import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { routes } from './routes'
import Layout from './components/layout/Layout'

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext'


function AppRouter() {
  const {
    isAuthenticated,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando...
        </p>
      </div>
    )
  }

  const publicRoutes = routes.filter(
    (route) => !route.private,
  )

  const privateRoutes = routes.filter(
    (route) => route.private,
  )

  return (
    <Routes>

      {/* Rutas públicas */}
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.restricted &&
            isAuthenticated ? (
              <Navigate
                to="/productos"
                replace
              />
            ) : (
              <route.component />
            )
          }
        />
      ))}

      {/* Rutas privadas */}
      <Route
        element={
          isAuthenticated ? (
            <Layout />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      >
        {privateRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Route>

      {/* Ruta inicial */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? '/productos'
                : '/login'
            }
            replace
          />
        }
      />

      {/* Cualquier URL incorrecta */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  )
}


function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App