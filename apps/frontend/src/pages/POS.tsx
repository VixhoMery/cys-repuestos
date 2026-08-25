import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

import PosProductCard from '../components/pos/PosProductCard'
import Cart from '../components/pos/Cart'
import {
  getProducts,
  type Product,
} from '../api/products'

import {
  createSale,
} from '../api/sales'



// ------------------------------------
// Producto dentro de la venta
// ------------------------------------

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  stock: number
}


function POS() {
  // ------------------------------------
  // Estados
  // ------------------------------------

  const [search, setSearch] =
    useState('')

  const [products, setProducts] =
    useState<Product[]>([])

  const [page, setPage] =
    useState(1)

  const [debouncedSearch, setDebouncedSearch] =
    useState('')

  const [productsLoading, setProductsLoading] =
    useState(true)

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })

  const [cart, setCart] =
    useState<CartItem[]>([])

  const [
    showCancelModal,
    setShowCancelModal,
  ] = useState(false)

  const [
    showFinishModal,
    setShowFinishModal,
  ] = useState(false)

  const [
    saleCompleted,
    setSaleCompleted,
  ] = useState(false)


  // ------------------------------------
  // Esperar brevemente al escribir
  // ------------------------------------

  useEffect(() => {
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
  // Cargar 25 productos por página
  // ------------------------------------

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true)

        const result =
          await getProducts({
            page,
            limit: 25,
            search:
              debouncedSearch ||
              undefined,
          })

        setProducts(result.data)
        setPagination(
          result.pagination,
        )
      } catch (error) {
        console.error(
          'Error cargando productos en POS:',
          error,
        )
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [
    page,
    debouncedSearch,
  ])


  // ------------------------------------
  // Total de la venta
  // ------------------------------------

  const total = cart.reduce(
    (accumulator, item) =>
      accumulator +
      item.price * item.quantity,
    0,
  )


  // ------------------------------------
  // Cantidad total de unidades
  // ------------------------------------

  const totalUnits = cart.reduce(
    (accumulator, item) =>
      accumulator + item.quantity,
    0,
  )


  // ------------------------------------
  // Agregar producto
  // ------------------------------------

  const addProduct = (id: number) => {
    const product =
      products.find(
        (product) => product.id === id,
      )

    if (!product || product.stock === 0) {
      return
    }

    setCart((currentCart) => {
      const existing =
        currentCart.find(
          (item) => item.id === id,
        )

      if (existing) {
        if (
          existing.quantity >=
          existing.stock
        ) {
          return currentCart
        }

        return currentCart.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item,
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: 1,
        },
      ]
    })
  }


  // ------------------------------------
  // Aumentar cantidad
  // ------------------------------------

  const increaseQuantity = (
    id: number,
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id &&
        item.quantity < item.stock
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item,
      ),
    )
  }


  // ------------------------------------
  // Disminuir cantidad
  // ------------------------------------

  const decreaseQuantity = (
    id: number,
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item,
        )
        .filter(
          (item) =>
            item.quantity > 0,
        ),
    )
  }


  // ------------------------------------
  // Eliminar producto
  // ------------------------------------

  const removeProduct = (
    id: number,
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id,
      ),
    )
  }


  // ====================================
  // CANCELAR VENTA
  // ====================================

  const requestCancelSale = () => {
    if (cart.length === 0) {
      return
    }

    setShowCancelModal(true)
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
  }

  const confirmCancelSale = () => {
    setCart([])
    setShowCancelModal(false)
  }


  // ====================================
  // FINALIZAR VENTA
  // ====================================

  const requestFinishSale = () => {
    if (cart.length === 0) {
      return
    }

    setShowFinishModal(true)
  }

  const closeFinishModal = () => {
    setShowFinishModal(false)
  }

  const confirmFinishSale = async () => {
    try {
      await createSale({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      })

      // Volver a consultar productos para
      // reflejar inmediatamente el stock real.
      const updatedProducts =
        await getProducts({
          page,
          limit: 25,
          search:
            debouncedSearch ||
            undefined,
        })

      setProducts(
        updatedProducts.data,
      )

      setPagination(
        updatedProducts.pagination,
      )
      setCart([])
      setShowFinishModal(false)
      setSaleCompleted(true)
    } catch (error) {
      console.error(
        'Error registrando venta:',
        error,
      )

      window.alert(
        'No fue posible registrar la venta. Revisa el stock e inténtalo nuevamente.',
      )
    }
  }


  return (
    <section>
      {/* Encabezado */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Punto de Venta
        </h1>

        <p className="mt-1 text-slate-500">
          Selecciona los productos para registrar
          una nueva venta.
        </p>
      </header>


      {/* Mensaje temporal de venta registrada */}
      {saleCompleted && (
        <div
          className="
            mb-6 flex items-center justify-between
            rounded-xl
            border border-green-200
            bg-green-50
            px-5 py-4
            text-green-700
          "
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={21} />

            <span className="font-medium">
              Venta registrada correctamente.
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setSaleCompleted(false)
            }
            className="
              rounded-lg p-1
              hover:bg-green-100
            "
          >
            <X size={18} />
          </button>
        </div>
      )}


      {/* Contenido principal */}
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">

        {/* Catálogo */}
        <div>
          {/* Buscador */}
          <div className="relative mb-6 max-w-xl">
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
              onChange={(event) => {
                setSearch(
                  event.target.value,
                )
                setPage(1)
              }}
              placeholder="Buscar producto..."
              className="
                w-full rounded-xl
                border border-slate-200
                bg-white
                py-3 pl-12 pr-4
                outline-none
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>


          {/* Productos */}
          <div
            className="
              grid
              grid-cols-2
              gap-4
              md:grid-cols-3
              2xl:grid-cols-4
            "
          >
            {productsLoading ? (
              <div
                className="
                  col-span-full
                  flex min-h-48
                  items-center
                  justify-center
                  rounded-xl
                  border border-slate-200
                  bg-white
                "
              >
                <div className="text-center">
                  <LoaderCircle
                    size={28}
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
            ) : products.length > 0 ? (
              products.map(
                (product) => (
                  <PosProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    brand={product.brand}
                    price={product.price}
                    stock={product.stock}
                    image={product.image}
                    onAdd={addProduct}
                  />
                ),
              )
            ) : (
              <div
                className="
                  col-span-full
                  rounded-xl
                  border border-dashed
                  border-slate-300
                  bg-white
                  p-10
                  text-center
                  text-slate-500
                "
              >
                No se encontraron productos.
              </div>
            )}
          </div>

          {!productsLoading &&
            pagination.total > 0 && (
              <div
                className="
                  mt-6
                  flex flex-col
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-3
                  sm:flex-row
                "
              >
                <p className="text-sm text-slate-500">
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
                  {pagination.total}
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
                      size={16}
                    />
                    Anterior
                  </button>

                  <span className="text-sm font-medium text-slate-600">
                    {pagination.page}/
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
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}
        </div>


        {/* Venta actual */}
        <Cart
          items={cart}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeProduct}
          onCancel={requestCancelSale}
          onFinish={requestFinishSale}
        />
      </div>


      {/* ==================================
          MODAL FINALIZAR VENTA
      ================================== */}

      {showFinishModal && (
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
              w-full max-w-lg
              rounded-2xl
              bg-white
              shadow-xl
            "
          >
            {/* Cabecera */}
            <div
              className="
                flex items-start justify-between
                border-b border-slate-200
                p-6
              "
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Confirmar venta
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Revisa los productos antes de
                  registrar la venta.
                </p>
              </div>

              <button
                type="button"
                onClick={closeFinishModal}
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
              >
                <X size={20} />
              </button>
            </div>


            {/* Productos */}
            <div
              className="
                max-h-72
                overflow-y-auto
                px-6
              "
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="
                    flex items-center
                    justify-between
                    gap-4
                    border-b
                    border-slate-100
                    py-4
                    last:border-b-0
                  "
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.quantity} × $
                      {item.price.toLocaleString(
                        'es-CL',
                      )}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    $
                    {(
                      item.price *
                      item.quantity
                    ).toLocaleString(
                      'es-CL',
                    )}
                  </p>
                </div>
              ))}
            </div>


            {/* Resumen */}
            <div
              className="
                border-t
                border-slate-200
                bg-slate-50
                px-6 py-5
              "
            >
              <div className="flex justify-between text-sm text-slate-500">
                <span>
                  Productos vendidos
                </span>

                <span>
                  {totalUnits}
                </span>
              </div>

              <div
                className="
                  mt-3 flex
                  items-center
                  justify-between
                "
              >
                <span className="font-semibold text-slate-900">
                  Total
                </span>

                <span className="text-2xl font-bold text-slate-900">
                  $
                  {total.toLocaleString(
                    'es-CL',
                  )}
                </span>
              </div>
            </div>


            {/* Botones */}
            <div className="flex gap-3 p-6">
              <button
                type="button"
                onClick={closeFinishModal}
                className="
                  flex-1
                  rounded-xl
                  border border-slate-300
                  bg-white
                  px-4 py-3
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Volver
              </button>

              <button
                type="button"
                onClick={confirmFinishSale}
                className="
                  flex-1
                  rounded-xl
                  bg-blue-600
                  px-4 py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                Confirmar venta
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ==================================
          MODAL CANCELAR VENTA
      ================================== */}

      {showCancelModal && (
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
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11
                    shrink-0
                    items-center
                    justify-center
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
                    ¿Cancelar venta?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Se eliminará la venta actual.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
              >
                <X size={20} />
              </button>
            </div>


            {/* Advertencia */}
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
                Se eliminarán todos los productos
                seleccionados. Esta acción no
                registrará ninguna venta.
              </p>
            </div>


            {/* Botones */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeCancelModal}
                className="
                  flex-1
                  rounded-xl
                  border border-slate-300
                  bg-white
                  px-4 py-3
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Volver
              </button>

              <button
                type="button"
                onClick={confirmCancelSale}
                className="
                  flex-1
                  rounded-xl
                  bg-red-600
                  px-4 py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                "
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default POS