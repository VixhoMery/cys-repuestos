import { Route, Routes } from 'react-router'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <h1 className="text-4xl font-bold text-slate-800">
              C&S Repuestos
            </h1>
          </div>
        }
      />
    </Routes>
  )
}

export default App