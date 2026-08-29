import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { routes } from './routes'
import Layout from './components/layout/Layout'
import ActivateAccount from './pages/auth/ActivateAccount'

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext'

function AppRouter() {
  const {
    isAuthenticated,
    isAuthorized,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Cargando...</p>
      </div>
    )
  }

  const publicRoutes = routes.filter((route) => !route.private)
  const privateRoutes = routes.filter((route) => route.private)

  const authenticatedHome = isAuthorized
    ? '/productos'
    : '/activar'

  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.restricted && isAuthenticated ? (
              <Navigate to={authenticatedHome} replace />
            ) : (
              <route.component />
            )
          }
        />
      ))}

      <Route
        path="/activar"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : isAuthorized ? (
            <Navigate to="/productos" replace />
          ) : (
            <ActivateAccount />
          )
        }
      />

      <Route
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : !isAuthorized ? (
            <Navigate to="/activar" replace />
          ) : (
            <Layout />
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

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? authenticatedHome : '/login'}
            replace
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
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
