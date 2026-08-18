import ProductCard from './components/ProductCard'

function App() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="grid grid-cols-8 gap-6 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-7">
        <ProductCard
          name="Alternador Toyota"
          price={54990}
          stock={4}
        />

        <ProductCard
          name="Filtro de aceite"
          price={7990}
          stock={18}
        />

        <ProductCard
          name="Pastillas de freno"
          price={25990}
          stock={7}
        />

        <ProductCard
          name="Alternador Toyota"
          price={54990}
          stock={4}
        />

        <ProductCard
          name="Alternador Toyota"
          price={54990}
          stock={4}
        />

        <ProductCard
          name="Alternador Toyota"
          price={54990}
          stock={4}
        />

        <ProductCard
          name="Alternador Toyota"
          price={54990}
          stock={4}
        />
      </div>
    </main>
  )
}

export default App