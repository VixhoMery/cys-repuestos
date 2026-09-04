import {
  useEffect,
  useState,
} from 'react'

import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
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

import {
  removeStorageImages,
} from '../../lib/productImages'

import {
  useAuth,
} from '../../context/AuthContext'


const PRODUCTS_SEARCH_STORAGE_KEY =
  'cys-products-search'


function getStoredProductsSearch() {
  try {
    return (
      window.sessionStorage.getItem(
        PRODUCTS_SEARCH_STORAGE_KEY,
      ) ?? ''
    )
  } catch {
    return ''
  }
}


function Products() {
  const navigate = useNavigate()

  const { hasPermission } = useAuth()

  const canCreateProduct =
    hasPermission('products.create')

  const canEditProduct =
    hasPermission('products.update')

  const canDeleteProduct =
    hasPermission('products.delete')


  // ------------------------------------
  // Productos reales
  // ------------------------------------

  const [products, setProducts] =
    useState<Product[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [page, setPage] =
    useState(1)

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })

  const [reloadKey, setReloadKey] =
    useState(0)


  // ------------------------------------
  // Filtros
  // ------------------------------------

  const [search, setSearch] =
    useState(
      getStoredProductsSearch,
    )

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('Todos')

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    () =>
      getStoredProductsSearch()
        .trim(),
  )


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
  // Esperar brevemente al escribir
  // ------------------------------------

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        PRODUCTS_SEARCH_STORAGE_KEY,
        search,
      )
    } catch {
      // La búsqueda sigue funcionando aunque
      // sessionStorage no esté disponible.
    }

    const timeout =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim(),
        )
      }, 350)

    return () =>
      window.clearTimeout(timeout)
  }, [search])


  // ------------------------------------
  // Cargar solo 25 productos
  // ------------------------------------

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError('')

        const result =
          await getProducts({
            page,
            limit: 25,
            search:
              debouncedSearch ||
              undefined,
            category:
              selectedCategory ===
              'Todos'
                ? undefined
                : selectedCategory,
          })

        setProducts(result.data)
        setPagination(
          result.pagination,
        )
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

    void loadProducts()
  }, [
    page,
    debouncedSearch,
    selectedCategory,
    reloadKey,
  ])


  // ------------------------------------
  // Solicitar eliminación
  // ------------------------------------

  const requestDeleteProduct = (
    id: number,
    name: string,
  ) => {
    if (!canDeleteProduct) {
      return
    }

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
      if (
        !productToDelete ||
        !canDeleteProduct
      ) {
        return
      }

      try {
        setDeleting(true)
        setDeleteError('')

        const product =
          products.find(
            (currentProduct) =>
              currentProduct.id ===
              productToDelete.id,
          )

        const storagePaths =
          product?.images
            .map(
              (image) =>
                image.storagePath,
            )
            .filter(
              (
                path,
              ): path is string =>
                path !== null,
            ) ?? []

        await deleteProduct(
          productToDelete.id,
        )

        if (
          storagePaths.length >
          0
        ) {
          try {
            await removeStorageImages(
              storagePaths,
            )
          } catch (
            cleanupError
          ) {
            console.error(
              'No fue posible borrar las imágenes del Storage:',
              cleanupError,
            )
          }
        }

        const wasLastProductOnPage =
          products.length === 1

        setProductToDelete(null)

        if (
          wasLastProductOnPage &&
          page > 1
        ) {
          setPage(
            (currentPage) =>
              currentPage - 1,
          )
        } else {
          setReloadKey(
            (currentKey) =>
              currentKey + 1,
          )
        }
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

        {canCreateProduct && (
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
        )}
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
          onChange={(event) => {
            setSearch(
              event.target.value,
            )
            setPage(1)
          }}
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
          onSelectCategory={(
            category,
          ) => {
            setSelectedCategory(
              category,
            )
            setPage(1)
          }}
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
            products.length >
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
                {products.map(
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
                      sku={
                        product.sku
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
                      image={
                        product.image
                      }
                      canEdit={
                        canEditProduct
                      }
                      canDelete={
                        canDeleteProduct
                      }
                      onDelete={
                        canDeleteProduct
                          ? requestDeleteProduct
                          : undefined
                      }
                    />
                  ),
                )}
              </div>
            )}

          {/* Sin resultados */}
          {!loading &&
            !error &&
            products.length ===
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

          {/* Paginación */}
          {!loading &&
            !error &&
            pagination.total >
              0 && (
              <div
                className="
                  mt-7
                  flex flex-col
                  items-center
                  justify-between
                  gap-4
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-3
                  sm:flex-row
                "
              >
                <p className="text-sm text-slate-500">
                  Mostrando{' '}
                  {(pagination.page - 1) *
                    pagination.limit +
                    1}
                  –
                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.total,
                  )}{' '}
                  de{' '}
                  {pagination.total}{' '}
                  productos
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          Math.max(
                            1,
                            currentPage -
                              1,
                          ),
                      )
                    }
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      border border-slate-200
                      bg-white
                      px-3 py-2
                      text-sm font-medium
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <ChevronLeft
                      size={17}
                    />
                    Anterior
                  </button>

                  <span
                    className="
                      min-w-28
                      text-center
                      text-sm
                      font-medium
                      text-slate-600
                    "
                  >
                    Página{' '}
                    {pagination.page}{' '}
                    de{' '}
                    {
                      pagination.totalPages
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          currentPage +
                          1,
                      )
                    }
                    disabled={
                      !pagination.hasNextPage
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      border border-slate-200
                      bg-white
                      px-3 py-2
                      text-sm font-medium
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    Siguiente
                    <ChevronRight
                      size={17}
                    />
                  </button>
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
                  disabled:opacity-50
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
