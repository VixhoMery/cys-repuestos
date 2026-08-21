import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  AlertTriangle,
  LoaderCircle,
  Plus,
  Search,
  X,
} from 'lucide-react'

import { useNavigate } from 'react-router'

import ProductCard from '../../components/products/ProductCard'
import CategoryFilter from '../../components/products/CategoryFilter'

import {
  deleteProduct,
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
  // Eliminar producto
  // ------------------------------------

  const [
    productToDelete,
    setProductToDelete,
  ] = useState<{
    id: number
    name: string
  } | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  const [deleteError, setDeleteError] =
    useState('')


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


  // ------------------------------------
  // Solicitar eliminación
  // ------------------------------------

  const requestDeleteProduct = (
    id: number,
    name: string,
  ) => {
    setDeleteError('')

    setProductToDelete({
      id,
      name,
    })
  }


  // ------------------------------------
  // Cerrar modal de eliminación
  // ------------------------------------

  const closeDeleteModal = () => {
    if (deleting) {
      return
    }

    setProductToDelete(null)
    setDeleteError('')
  }


  // ------------------------------------
  // Confirmar eliminación
  // ------------------------------------

  const confirmDeleteProduct =
    async () => {
      if (!productToDelete) {
        return
      }

      try {
        setDeleting(true)
        setDeleteError('')

        await deleteProduct(
          productToDelete.id,
        )

        setProducts(
          (currentProducts) =>
            currentProducts.filter(
              (product) =>
                product.id !==
                productToDelete.id,
            ),
        )

        setProductToDelete(null)
      } catch (error) {
        console.error(
          'Error eliminando producto:',
          error,
        )

        setDeleteError(
          'No fue posible eliminar el producto.',
        )
      } finally {
        setDeleting(false)
      }
    }


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
                      onDelete={
                        requestDeleteProduct
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


      {/* ==================================
          MODAL ELIMINAR PRODUCTO
      ================================== */}

      {productToDelete && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-xl
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11
                    shrink-0
                    items-center justify-center
                    rounded-full
                    bg-red-100
                    text-red-600
                  "
                >
                  <AlertTriangle
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    ¿Eliminar producto?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Esta acción no se puede
                    deshacer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="
                mt-6
                rounded-xl
                border border-red-100
                bg-red-50
                p-4
              "
            >
              <p className="text-sm text-red-700">
                Se eliminará{' '}
                <span className="font-semibold">
                  {productToDelete.name}
                </span>{' '}
                del catálogo.
              </p>
            </div>

            {deleteError && (
              <p className="mt-4 text-sm text-red-600">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="
                  flex-1 rounded-xl
                  border border-slate-300
                  bg-white
                  px-4 py-3
                  font-medium text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                Volver
              </button>

              <button
                type="button"
                onClick={
                  confirmDeleteProduct
                }
                disabled={deleting}
                className="
                  flex-1 rounded-xl
                  bg-red-600
                  px-4 py-3
                  font-medium text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {deleting
                  ? 'Eliminando...'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Products
