import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react'

import { useNavigate } from 'react-router'

import ProductCard from '../../components/products/ProductCard'
import CategoryFilter from '../../components/products/CategoryFilter'

import {
  getProducts,
  type Product,
} from '../../api/products'


function Products() {
  const navigate = useNavigate()

  // ------------------------------------
  // Productos reales
  // ------------------------------------

  const [products, setProducts] =
    useState<Product[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ------------------------------------
  // Filtros
  // ------------------------------------

  const [search, setSearch] =
    useState('')

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('Todos')


  // ------------------------------------
  // Cargar productos desde backend
  // ------------------------------------

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await getProducts()

        setProducts(data)
      } catch (error) {
        console.error(
          'Error cargando productos:',
          error,
        )

        setError(
          'No fue posible cargar los productos.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])


  // ------------------------------------
  // Filtrar productos
  // ------------------------------------

  const filteredProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return products.filter(
        (product) => {
          const matchesCategory =
            selectedCategory ===
              'Todos' ||
            product.category ===
              selectedCategory

          const matchesSearch =
            query === '' ||
            product.name
              .toLowerCase()
              .includes(query) ||
            product.brand
              .toLowerCase()
              .includes(query) ||
            product.sku
              .toLowerCase()
              .includes(query)

          return (
            matchesCategory &&
            matchesSearch
          )
        },
      )
    }, [
      products,
      search,
      selectedCategory,
    ])


  return (
    <section>
      {/* Encabezado */}
      <header
        className="
          mb-8
          flex flex-col
          justify-between
          gap-4
          lg:flex-row
          lg:items-end
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Productos
          </h1>

          <p className="mt-1 text-slate-500">
            Gestiona el catálogo de
            productos de C&S Repuestos.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/productos/nuevo',
            )
          }
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5 py-3
            font-medium
            text-white
            transition
            hover:bg-blue-700
          "
        >
          <Plus size={19} />

          Agregar producto
        </button>
      </header>


      {/* Buscador */}
      <div
        className="
          relative mb-6
          max-w-xl
        "
      >
        <Search
          size={20}
          className="
            absolute
            left-4 top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Buscar por nombre, marca o SKU..."
          className="
            w-full
            rounded-xl
            border border-slate-200
            bg-white
            py-3
            pl-12 pr-4
            outline-none
            transition
            focus:border-blue-400
            focus:ring-2
            focus:ring-blue-100
          "
        />
      </div>


      {/* Contenido */}
      <div
        className="
          grid gap-8
          lg:grid-cols-[220px_1fr]
        "
      >
        {/* Categorías */}
        <CategoryFilter
          selectedCategory={
            selectedCategory
          }
          onSelectCategory={
            setSelectedCategory
          }
        />


        {/* Catálogo */}
        <div>

          {/* Cargando */}
          {loading && (
            <div
              className="
                flex min-h-72
                items-center
                justify-center
                rounded-2xl
                border
                border-slate-200
                bg-white
              "
            >
              <div className="text-center">
                <LoaderCircle
                  size={30}
                  className="
                    mx-auto
                    animate-spin
                    text-blue-600
                  "
                />

                <p className="mt-3 text-sm text-slate-500">
                  Cargando productos...
                </p>
              </div>
            </div>
          )}


          {/* Error */}
          {!loading && error && (
            <div
              className="
                flex min-h-72
                items-center
                justify-center
                rounded-2xl
                border border-red-200
                bg-red-50
                p-8
              "
            >
              <div className="text-center">
                <AlertCircle
                  size={30}
                  className="
                    mx-auto
                    text-red-500
                  "
                />

                <p className="mt-3 font-medium text-red-700">
                  {error}
                </p>

                <p className="mt-1 text-sm text-red-500">
                  Revisa que el backend
                  esté funcionando.
                </p>
              </div>
            </div>
          )}


          {/* Productos */}
          {!loading &&
            !error &&
            filteredProducts.length >
              0 && (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-6
                  sm:grid-cols-2
                  xl:grid-cols-5
                "
              >
                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={
                        product.name
                      }
                      brand={
                        product.brand
                      }
                      price={
                        product.price
                      }
                      stock={
                        product.stock
                      }
                      shortDescription={
                        product.shortDescription
                      }
                    />
                  ),
                )}
              </div>
            )}


          {/* Sin resultados */}
          {!loading &&
            !error &&
            filteredProducts.length ===
              0 && (
              <div
                className="
                  flex min-h-72
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-300
                  bg-white
                  p-8
                  text-center
                "
              >
                <div>
                  <p className="font-medium text-slate-700">
                    No se encontraron
                    productos.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Prueba cambiando la
                    búsqueda o la categoría.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  )
}

export default Products