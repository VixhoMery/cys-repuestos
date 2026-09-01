import {
  lazy,
  Suspense,
} from 'react'

import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import {
  routes,
} from './routes'

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext'

const Layout =
  lazy(() =>
    import(
      './components/layout/Layout'
    ),
  )

const ActivateAccount =
  lazy(() =>
    import(
      './pages/auth/ActivateAccount'
    ),
  )

function LoadingScreen() {
  return (
    <div
      className="
        flex min-h-screen
        items-center
        justify-center
        bg-slate-100
      "
    >
      <p className="text-slate-500">
        Cargando...
      </p>
    </div>
  )
}

function AppRouter() {
  const {
    isAuthenticated,
    isAuthorized,
    isManagementUser,
    hasPermission,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <LoadingScreen />
    )
  }

  const publicRoutes =
    routes.filter(
      (route) =>
        !route.private,
    )

  const privateRoutes =
    routes.filter(
      (route) =>
        route.private,
    )

  const authenticatedHome =
    isAuthorized
      ? '/productos'
      : '/activar'

  const canAccessRoute = (
    route:
      (typeof routes)[number],
  ) => {
    if (
      route.managementOnly
    ) {
      return (
        isManagementUser
      )
    }

    if (
      route.permission
    ) {
      return hasPermission(
        route.permission,
      )
    }

    return true
  }

  return (
    <Suspense
      fallback={
        <LoadingScreen />
      }
    >
      <Routes>
        {publicRoutes.map(
          (route) => (
            <Route
              key={
                route.path
              }
              path={
                route.path
              }
              element={
                route.restricted &&
                isAuthenticated ? (
                  <Navigate
                    to={
                      authenticatedHome
                    }
                    replace
                  />
                ) : (
                  <route.component />
                )
              }
            />
          ),
        )}

        <Route
          path="/activar"
          element={
            !isAuthenticated ? (
              <Navigate
                to="/login"
                replace
              />
            ) : isAuthorized ? (
              <Navigate
                to="/productos"
                replace
              />
            ) : (
              <ActivateAccount />
            )
          }
        />

        <Route
          element={
            !isAuthenticated ? (
              <Navigate
                to="/login"
                replace
              />
            ) : !isAuthorized ? (
              <Navigate
                to="/activar"
                replace
              />
            ) : (
              <Layout />
            )
          }
        >
          {privateRoutes.map(
            (route) => (
              <Route
                key={
                  route.path
                }
                path={
                  route.path
                }
                element={
                  canAccessRoute(
                    route,
                  ) ? (
                    <route.component />
                  ) : (
                    <Navigate
                      to="/productos"
                      replace
                    />
                  )
                }
              />
            ),
          )}
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? authenticatedHome
                  : '/login'
              }
              replace
            />
          }
        />

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
    </Suspense>
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