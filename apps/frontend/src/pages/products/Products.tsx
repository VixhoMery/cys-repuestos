import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router'

import ProductCard from '../../components/products/ProductCard'
import CategoryFilter from '../../components/products/CategoryFilter'

const products = [
  {
    id: 1,
    name: 'Alternador Toyota Yaris',
    brand: 'Bosch',
    category: 'Motor',
    price: 180000,
    stock: 4,
    shortDescription:
      'Alternador compatible con Toyota Yaris modelos 2006–2012.',
  },
  {
    id: 2,
    name: 'Pastillas de freno',
    brand: 'Brembo',
    category: 'Frenos',
    price: 45990,
    stock: 12,
    shortDescription:
      'Juego de pastillas delanteras de alto rendimiento.',
  },
  {
    id: 3,
    name: 'Filtro de aceite',
    brand: 'Mann Filter',
    category: 'Motor',
    price: 8990,
    stock: 2,
    shortDescription:
      'Filtro de aceite compatible con múltiples modelos Toyota.',
  },
  {
    id: 4,
    name: 'Neumático 195/65 R15',
    brand: 'Michelin',
    category: 'Neumáticos',
    price: 74990,
    stock: 8,
    shortDescription:
      'Neumático para vehículos de uso urbano y carretera.',
  },
]

function Products() {
  const navigate = useNavigate()

  const [selectedCategory, setSelectedCategory] =
    useState('Todos')

  const [search, setSearch] = useState('')

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'Todos' ||
      product.category === selectedCategory

    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      product.brand
        .toLowerCase()
        .includes(search.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <section className="min-h-screen">
      {/* Cabecera */}
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Productos
          </h1>

          <p className="mt-1 text-slate-500">
            Catálogo y administración de repuestos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/productos/nuevo')}
          className="
            flex items-center gap-2
            rounded-full
            bg-blue-500
            px-6 py-3
            font-medium text-white
            transition
            hover:bg-blue-600
          "
        >
          <Plus size={20} />

          Agregar producto
        </button>
      </header>

      {/* Buscador */}
      <div className="mb-8 max-w-xl">
        <div className="relative">
          <Search
            size={20}
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar por producto o marca..."
            className="
              w-full rounded-xl
              border border-slate-200
              bg-white
              py-3 pl-12 pr-4
              outline-none
              transition
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>
      </div>

      {/* Catálogo */}
      <div className="flex flex-col gap-10 lg:flex-row">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1">
          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              xl:grid-cols-3
              2xl:grid-cols-4
            "
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() =>
                  navigate(`/productos/${product.id}`)
                }
              >
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  stock={product.stock}
                  shortDescription={product.shortDescription}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </section>
  )
}

export default Products