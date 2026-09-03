import {
  useEffect,
  useState,
} from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Printer,
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
  CREDIT_INSTALLMENT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  createSale,
  createdSaleToReceiptSale,
  type CreatedSale,
  type PaymentMethod,
} from '../api/sales'

import SaleReceipt from '../components/sales/SaleReceipt'

import {
  printSaleReceipt,
} from '../lib/saleReceipt'


// ============================================================
// PRODUCTO DENTRO DE LA VENTA
// ============================================================

type InventoryCartItem = {
  id: number
  itemType: 'inventory'
  name: string
  price: number
  quantity: number
  stock: number
  netPrice: number | null
  priceWithTax: number | null
}


type TemporaryCartItem = {
  id: number
  itemType: 'temporary'
  name: string
  price: number
  quantity: number
  stock: null
  netPrice: number
  priceWithTax: number
}


type CartItem =
  | InventoryCartItem
  | TemporaryCartItem


type TemporaryProductForm = {
  name: string
  netPrice: string
  salePrice: string
  quantity: string
}


const EMPTY_TEMPORARY_PRODUCT_FORM:
  TemporaryProductForm = {
    name: '',
    netPrice: '',
    salePrice: '',
    quantity: '1',
  }


// ============================================================
// HELPERS
// ============================================================

function calculatePriceWithTax(
  netPrice: number,
) {
  return Math.round(
    netPrice * 1.19,
  )
}


function parsePositiveInteger(
  value: string,
) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsed =
    Number(value)

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed <= 0
  ) {
    return null
  }

  return parsed
}


function POS() {
  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    search,
    setSearch,
  ] =
    useState('')


  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([])


  const [
    page,
    setPage,
  ] =
    useState(1)


  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState('')


  const [
    productsLoading,
    setProductsLoading,
  ] =
    useState(true)


  const [
    pagination,
    setPagination,
  ] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })


  const [
    cart,
    setCart,
  ] =
    useState<CartItem[]>([])


  const [
    nextTemporaryId,
    setNextTemporaryId,
  ] =
    useState(-1)


  // ----------------------------------------------------------
  // Modal producto temporal
  // ----------------------------------------------------------

  const [
    showTemporaryProductModal,
    setShowTemporaryProductModal,
  ] =
    useState(false)


  const [
    temporaryProductForm,
    setTemporaryProductForm,
  ] =
    useState<TemporaryProductForm>({
      ...EMPTY_TEMPORARY_PRODUCT_FORM,
    })


  const [
    temporaryProductError,
    setTemporaryProductError,
  ] =
    useState('')


  // ----------------------------------------------------------
  // Modales venta
  // ----------------------------------------------------------

  const [
    showCancelModal,
    setShowCancelModal,
  ] =
    useState(false)


  const [
    showFinishModal,
    setShowFinishModal,
  ] =
    useState(false)


  const [
    saleCompleted,
    setSaleCompleted,
  ] =
    useState(false)


  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      PaymentMethod | ''
    >('')


  const [
    completedSale,
    setCompletedSale,
  ] =
    useState<
      CreatedSale | null
    >(null)


  const [
    creditInstallments,
    setCreditInstallments,
  ] =
    useState<
      number | ''
    >('')


  const [
    printError,
    setPrintError,
  ] =
    useState('')


  const [
    saleSubmitting,
    setSaleSubmitting,
  ] =
    useState(false)


  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim(),
          )
        },
        350,
      )

    return () =>
      window.clearTimeout(
        timeout,
      )
  }, [search])


  // ==========================================================
  // CARGAR PRODUCTOS
  // ==========================================================

  useEffect(() => {
    const loadProducts =
      async () => {
        try {
          setProductsLoading(
            true,
          )

          const result =
            await getProducts({
              page,
              limit: 25,
              search:
                debouncedSearch ||
                undefined,
            })

          setProducts(
            result.data,
          )

          setPagination(
            result.pagination,
          )
        } catch (error) {
          console.error(
            'Error cargando productos en POS:',
            error,
          )
        } finally {
          setProductsLoading(
            false,
          )
        }
      }

    void loadProducts()
  }, [
    page,
    debouncedSearch,
  ])


  // ==========================================================
  // TOTALES
  // ==========================================================

  const total =
    cart.reduce(
      (
        accumulator,
        item,
      ) =>
        accumulator +
        item.price *
          item.quantity,
      0,
    )


  const totalUnits =
    cart.reduce(
      (
        accumulator,
        item,
      ) =>
        accumulator +
        item.quantity,
      0,
    )


  const temporaryNetPrice =
    parsePositiveInteger(
      temporaryProductForm.netPrice,
    )


  const temporaryPriceWithTax =
    temporaryNetPrice
      ? calculatePriceWithTax(
          temporaryNetPrice,
        )
      : 0


  // ==========================================================
  // AGREGAR PRODUCTO DE INVENTARIO
  // ==========================================================

  const addProduct = (
    id: number,
  ) => {
    const product =
      products.find(
        (product) =>
          product.id === id,
      )

    if (
      !product ||
      product.stock === 0
    ) {
      return
    }


    setCart(
      (
        currentCart,
      ) => {
        const existing =
          currentCart.find(
            (item) =>
              item.itemType ===
                'inventory' &&
              item.id === id,
          )


        if (
          existing &&
          existing.itemType ===
            'inventory'
        ) {
          if (
            existing.quantity >=
            existing.stock
          ) {
            return currentCart
          }


          return currentCart.map(
            (item) =>
              item.itemType ===
                'inventory' &&
              item.id === id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item,
          )
        }


        return [
          ...currentCart,
          {
            id:
              product.id,

            itemType:
              'inventory',

            name:
              product.name,

            price:
              product.price,

            quantity:
              1,

            stock:
              product.stock,

            netPrice:
              product.netPrice ??
              null,

            priceWithTax:
              product.priceWithTax ??
              null,
          },
        ]
      },
    )
  }


  // ==========================================================
  // PRODUCTO TEMPORAL
  // ==========================================================

  const openTemporaryProductModal =
    () => {
      setTemporaryProductForm({
        ...EMPTY_TEMPORARY_PRODUCT_FORM,
      })

      setTemporaryProductError(
        '',
      )

      setShowTemporaryProductModal(
        true,
      )
    }


  const closeTemporaryProductModal =
    () => {
      setShowTemporaryProductModal(
        false,
      )

      setTemporaryProductError(
        '',
      )

      setTemporaryProductForm({
        ...EMPTY_TEMPORARY_PRODUCT_FORM,
      })
    }


  const addTemporaryProduct =
    () => {
      const name =
        temporaryProductForm.name
          .trim()


      const netPrice =
        parsePositiveInteger(
          temporaryProductForm.netPrice,
        )


      const salePrice =
        parsePositiveInteger(
          temporaryProductForm.salePrice,
        )


      const quantity =
        parsePositiveInteger(
          temporaryProductForm.quantity,
        )


      if (
        name.length < 1 ||
        name.length > 100
      ) {
        setTemporaryProductError(
          'Ingresa un nombre válido de hasta 100 caracteres.',
        )

        return
      }


      if (!netPrice) {
        setTemporaryProductError(
          'Ingresa un valor neto válido mayor a $0.',
        )

        return
      }


      if (!salePrice) {
        setTemporaryProductError(
          'Ingresa un valor de venta válido mayor a $0.',
        )

        return
      }


      if (!quantity) {
        setTemporaryProductError(
          'Ingresa una cantidad válida mayor a 0.',
        )

        return
      }


      const priceWithTax =
        calculatePriceWithTax(
          netPrice,
        )


      const temporaryId =
        nextTemporaryId


      setCart(
        (
          currentCart,
        ) => [
          ...currentCart,
          {
            id:
              temporaryId,

            itemType:
              'temporary',

            name,

            price:
              salePrice,

            quantity,

            stock:
              null,

            netPrice,

            priceWithTax,
          },
        ],
      )


      setNextTemporaryId(
        (
          currentId,
        ) =>
          currentId - 1,
      )


      closeTemporaryProductModal()
  }


  // ==========================================================
  // CANTIDADES DEL CARRITO
  // ==========================================================

  const increaseQuantity = (
    id: number,
  ) => {
    setCart(
      (
        currentCart,
      ) =>
        currentCart.map(
          (item) => {
            if (
              item.id !== id
            ) {
              return item
            }


            if (
              item.itemType ===
              'temporary'
            ) {
              return {
                ...item,
                quantity:
                  item.quantity +
                  1,
              }
            }


            if (
              item.quantity >=
              item.stock
            ) {
              return item
            }


            return {
              ...item,
              quantity:
                item.quantity +
                1,
            }
          },
        ),
    )
  }


  const decreaseQuantity = (
    id: number,
  ) => {
    setCart(
      (
        currentCart,
      ) =>
        currentCart
          .map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  }
                : item,
          )
          .filter(
            (item) =>
              item.quantity >
              0,
          ),
    )
  }


  const removeProduct = (
    id: number,
  ) => {
    setCart(
      (
        currentCart,
      ) =>
        currentCart.filter(
          (item) =>
            item.id !== id,
        ),
    )
  }


  // ==========================================================
  // CANCELAR VENTA
  // ==========================================================

  const requestCancelSale =
    () => {
      if (
        cart.length === 0
      ) {
        return
      }

      setShowCancelModal(
        true,
      )
    }


  const closeCancelModal =
    () => {
      setShowCancelModal(
        false,
      )
    }


  const confirmCancelSale =
    () => {
      setCart([])
      setShowCancelModal(
        false,
      )
    }


  // ==========================================================
  // FINALIZAR VENTA
  // ==========================================================

  const requestFinishSale =
    () => {
      if (
        cart.length === 0
      ) {
        return
      }

      setPaymentMethod('')
      setCreditInstallments(
        '',
      )
      setPrintError('')
      setShowFinishModal(
        true,
      )
    }


  const closeFinishModal =
    () => {
      if (saleSubmitting) {
        return
      }

      setShowFinishModal(
        false,
      )
    }


  const confirmFinishSale =
    async () => {
      if (
        !paymentMethod ||
        saleSubmitting
      ) {
        return
      }


      if (
        paymentMethod ===
          'credito' &&
        !creditInstallments
      ) {
        return
      }


      try {
        setSaleSubmitting(
          true,
        )


        const createdSale =
          await createSale({
            items:
              cart.map(
                (item) => {
                  if (
                    item.itemType ===
                    'temporary'
                  ) {
                    return {
                      type:
                        'temporary' as const,

                      name:
                        item.name,

                      netPrice:
                        item.netPrice,

                      salePrice:
                        item.price,

                      quantity:
                        item.quantity,
                    }
                  }


                  return {
                    type:
                      'inventory' as const,

                    productId:
                      item.id,

                    quantity:
                      item.quantity,
                  }
                },
              ),

            paymentMethod,

            installments:
              paymentMethod ===
              'credito'
                ? Number(
                    creditInstallments,
                  )
                : null,
          })


        // Volvemos a consultar productos para
        // reflejar inmediatamente el stock real
        // de los ítems de inventario.
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

        setShowFinishModal(
          false,
        )

        setPaymentMethod('')

        setCreditInstallments(
          '',
        )

        setCompletedSale(
          createdSale,
        )

        setSaleCompleted(
          true,
        )
      } catch (error) {
        console.error(
          'Error registrando venta:',
          error,
        )

        window.alert(
          error instanceof Error
            ? error.message
            : 'No fue posible registrar la venta. Revisa los datos e inténtalo nuevamente.',
        )
      } finally {
        setSaleSubmitting(
          false,
        )
      }
    }


  // ==========================================================
  // COMPROBANTE
  // ==========================================================

  const closeReceiptModal =
    () => {
      setCompletedSale(
        null,
      )

      setPrintError('')
    }


  const handlePrintReceipt =
    () => {
      if (!completedSale) {
        return
      }


      try {
        setPrintError('')

        printSaleReceipt(
          createdSaleToReceiptSale(
            completedSale,
          ),
        )
      } catch (error) {
        console.error(
          'Error imprimiendo comprobante:',
          error,
        )

        setPrintError(
          'No fue posible abrir la impresión. Revisa si el navegador bloqueó la ventana emergente.',
        )
      }
    }


  // ==========================================================
  // RENDER
  // ==========================================================

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
              setSaleCompleted(
                false,
              )
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
          {/* Buscador + Producto temporal */}
          <div
            className="
              mb-6
              flex flex-col
              gap-3
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="relative w-full max-w-xl">
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


            <button
              type="button"
              onClick={
                openTemporaryProductModal
              }
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                px-4 py-3
                font-medium
                text-blue-700
                transition
                hover:bg-blue-100
              "
            >
              <Plus size={18} />

              Producto temporal
            </button>
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
                (
                  product,
                ) => (
                  <PosProductCard
                    key={
                      product.id
                    }
                    id={
                      product.id
                    }
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
                    image={
                      product.image
                    }
                    onAdd={
                      addProduct
                    }
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
            pagination.total >
              0 && (
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
                  {(pagination.page -
                    1) *
                    pagination.limit +
                    1}
                  –
                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.total,
                  )}{' '}
                  de{' '}
                  {
                    pagination.total
                  }
                </p>


                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          currentPage,
                        ) =>
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
                    {
                      pagination.page
                    }
                    /
                    {
                      pagination.totalPages
                    }
                  </span>


                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          currentPage,
                        ) =>
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
          onIncrease={
            increaseQuantity
          }
          onDecrease={
            decreaseQuantity
          }
          onRemove={
            removeProduct
          }
          onCancel={
            requestCancelSale
          }
          onFinish={
            requestFinishSale
          }
        />
      </div>


      {/* ======================================================
          MODAL PRODUCTO TEMPORAL
      ====================================================== */}

      {showTemporaryProductModal && (
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
                flex
                items-start
                justify-between
                border-b
                border-slate-200
                p-6
              "
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Producto temporal
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Agrégalo solo a esta venta. No se guardará en el inventario ni modificará stock.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeTemporaryProductModal
                }
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
                aria-label="Cerrar producto temporal"
              >
                <X size={20} />
              </button>
            </div>


            {/* Formulario */}
            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="temporary-product-name"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  Nombre del producto
                </label>

                <input
                  id="temporary-product-name"
                  type="text"
                  maxLength={100}
                  value={
                    temporaryProductForm.name
                  }
                  onChange={(event) =>
                    setTemporaryProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Ej: Alternador especial"
                  className="
                    w-full rounded-xl
                    border border-slate-300
                    bg-white
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>


              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="temporary-product-net-price"
                    className="
                      mb-2 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Valor neto
                  </label>

                  <input
                    id="temporary-product-net-price"
                    type="text"
                    inputMode="numeric"
                    value={
                      temporaryProductForm.netPrice
                    }
                    onChange={(event) =>
                      setTemporaryProductForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          netPrice:
                            event.target
                              .value
                              .replace(
                                /\D/g,
                                '',
                              ),
                        }),
                      )
                    }
                    placeholder="80000"
                    className="
                      w-full rounded-xl
                      border border-slate-300
                      bg-white
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>


                <div>
                  <label
                    htmlFor="temporary-product-tax-price"
                    className="
                      mb-2 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Valor con IVA
                  </label>

                  <input
                    id="temporary-product-tax-price"
                    type="text"
                    readOnly
                    value={
                      temporaryPriceWithTax >
                      0
                        ? temporaryPriceWithTax.toLocaleString(
                            'es-CL',
                          )
                        : ''
                    }
                    placeholder="Se calcula automáticamente"
                    className="
                      w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      px-4 py-3
                      text-slate-600
                      outline-none
                    "
                  />
                </div>
              </div>


              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="temporary-product-sale-price"
                    className="
                      mb-2 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Valor de venta
                  </label>

                  <input
                    id="temporary-product-sale-price"
                    type="text"
                    inputMode="numeric"
                    value={
                      temporaryProductForm.salePrice
                    }
                    onChange={(event) =>
                      setTemporaryProductForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          salePrice:
                            event.target
                              .value
                              .replace(
                                /\D/g,
                                '',
                              ),
                        }),
                      )
                    }
                    placeholder="115000"
                    className="
                      w-full rounded-xl
                      border border-slate-300
                      bg-white
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>


                <div>
                  <label
                    htmlFor="temporary-product-quantity"
                    className="
                      mb-2 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Cantidad vendida
                  </label>

                  <input
                    id="temporary-product-quantity"
                    type="text"
                    inputMode="numeric"
                    value={
                      temporaryProductForm.quantity
                    }
                    onChange={(event) =>
                      setTemporaryProductForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          quantity:
                            event.target
                              .value
                              .replace(
                                /\D/g,
                                '',
                              ),
                        }),
                      )
                    }
                    placeholder="1"
                    className="
                      w-full rounded-xl
                      border border-slate-300
                      bg-white
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>
              </div>


              <div
                className="
                  rounded-xl
                  border border-blue-100
                  bg-blue-50
                  px-4 py-3
                "
              >
                <p className="text-sm text-blue-700">
                  El IVA corresponde al 19% y se vuelve a calcular en el servidor al registrar la venta.
                </p>
              </div>


              {temporaryProductError && (
                <div
                  className="
                    rounded-xl
                    border border-red-200
                    bg-red-50
                    px-4 py-3
                    text-sm
                    text-red-700
                  "
                >
                  {
                    temporaryProductError
                  }
                </div>
              )}
            </div>


            {/* Botones */}
            <div
              className="
                flex gap-3
                border-t
                border-slate-200
                p-6
              "
            >
              <button
                type="button"
                onClick={
                  closeTemporaryProductModal
                }
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
                Cancelar
              </button>


              <button
                type="button"
                onClick={
                  addTemporaryProduct
                }
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-4 py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                <Plus size={18} />

                Agregar a la venta
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================
          MODAL FINALIZAR VENTA
      ====================================================== */}

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
                onClick={
                  closeFinishModal
                }
                disabled={
                  saleSubmitting
                }
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                  disabled:opacity-50
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
              {cart.map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.id
                    }
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {
                            item.name
                          }
                        </p>

                        {item.itemType ===
                          'temporary' && (
                          <span
                            className="
                              rounded-full
                              bg-amber-100
                              px-2 py-0.5
                              text-[11px]
                              font-semibold
                              uppercase
                              tracking-wide
                              text-amber-700
                            "
                          >
                            Temporal
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          item.quantity
                        }{' '}
                        × $
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
                ),
              )}
            </div>


            {/* Método de pago */}
            <div
              className="
                border-t
                border-slate-200
                px-6 py-5
              "
            >
              <label
                htmlFor="sale-payment-method"
                className="
                  mb-2 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Método de pago
              </label>


              <select
                id="sale-payment-method"
                value={
                  paymentMethod
                }
                onChange={(event) => {
                  const value =
                    event.target.value as
                      | PaymentMethod
                      | ''

                  setPaymentMethod(
                    value,
                  )

                  if (
                    value !==
                    'credito'
                  ) {
                    setCreditInstallments(
                      '',
                    )
                  }
                }}
                disabled={
                  saleSubmitting
                }
                className="
                  w-full rounded-xl
                  border border-slate-300
                  bg-white
                  px-4 py-3
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:bg-slate-50
                "
              >
                <option value="">
                  Selecciona un método de pago
                </option>

                {PAYMENT_METHOD_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>


              <p className="mt-1 text-xs text-slate-500">
                Debes seleccionarlo antes de registrar la venta.
              </p>


              {paymentMethod ===
                'credito' && (
                <div className="mt-4">
                  <label
                    htmlFor="sale-credit-installments"
                    className="
                      mb-2 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Cuotas
                  </label>


                  <select
                    id="sale-credit-installments"
                    value={
                      creditInstallments
                    }
                    onChange={(event) =>
                      setCreditInstallments(
                        event.target
                          .value ===
                          ''
                          ? ''
                          : Number(
                              event.target
                                .value,
                            ),
                      )
                    }
                    disabled={
                      saleSubmitting
                    }
                    className="
                      w-full rounded-xl
                      border border-slate-300
                      bg-white
                      px-4 py-3
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                      disabled:bg-slate-50
                    "
                  >
                    <option value="">
                      Selecciona las cuotas
                    </option>


                    {CREDIT_INSTALLMENT_OPTIONS.map(
                      (
                        installments,
                      ) => (
                        <option
                          key={
                            installments
                          }
                          value={
                            installments
                          }
                        >
                          {
                            installments
                          }{' '}
                          {installments ===
                          1
                            ? 'cuota'
                            : 'cuotas'}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}
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
                onClick={
                  closeFinishModal
                }
                disabled={
                  saleSubmitting
                }
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
                  disabled:opacity-50
                "
              >
                Volver
              </button>


              <button
                type="button"
                onClick={() =>
                  void confirmFinishSale()
                }
                disabled={
                  saleSubmitting ||
                  !paymentMethod ||
                  (
                    paymentMethod ===
                      'credito' &&
                    !creditInstallments
                  )
                }
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-4 py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                "
              >
                {saleSubmitting && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                {saleSubmitting
                  ? 'Registrando...'
                  : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================
          COMPROBANTE DE VENTA
      ====================================================== */}

      {completedSale && (
        <div
          className="
            fixed inset-0 z-[60]
            flex items-center justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full max-w-lg
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-xl
            "
          >
            <div
              className="
                flex items-start
                justify-between
                border-b
                border-slate-200
                p-6
              "
            >
              <div>
                <p className="text-sm font-medium text-green-600">
                  Venta registrada
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Comprobante de compra
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Puedes imprimirlo ahora o volver a imprimirlo desde Ventas.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeReceiptModal
                }
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
                aria-label="Cerrar comprobante"
              >
                <X size={20} />
              </button>
            </div>


            <div
              className="
                max-h-[60vh]
                overflow-y-auto
                bg-slate-50
                p-6
              "
            >
              <SaleReceipt
                sale={
                  createdSaleToReceiptSale(
                    completedSale,
                  )
                }
              />
            </div>


            {printError && (
              <p className="px-6 pt-4 text-sm text-red-600">
                {printError}
              </p>
            )}


            <div className="flex gap-3 p-6">
              <button
                type="button"
                onClick={
                  closeReceiptModal
                }
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
                Cerrar
              </button>


              <button
                type="button"
                onClick={
                  handlePrintReceipt
                }
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-4 py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                <Printer
                  size={18}
                />

                Imprimir comprobante
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================
          MODAL CANCELAR VENTA
      ====================================================== */}

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
                onClick={
                  closeCancelModal
                }
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
                onClick={
                  closeCancelModal
                }
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
                onClick={
                  confirmCancelSale
                }
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
