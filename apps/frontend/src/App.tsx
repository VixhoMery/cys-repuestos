import { Navigate, Route, Routes } from 'react-router'
import { routes } from './routes'
import Layout from './components/layout/Layout'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Route>

      <Route
        path="/"
        element={<Navigate to="/productos" replace />}
      />
    </Routes>
  )
}

export default App