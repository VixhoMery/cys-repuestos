import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  Package,
  Pencil,
  X,
} from 'lucide-react'

import {
  useNavigate,
  useParams,
} from 'react-router'

import {
  getProductById,
  updateInventory,
  type Product,
} from '../../api/products'

import {
  useAuth,
} from '../../context/AuthContext'

function ProductDetail() {
  const navigate =
    useNavigate()

  const { id } =
    useParams()

  const {
    hasPermission,
  } =
    useAuth()

  const canEditProduct =
    hasPermission(
      'products.update',
    )

  const canUpdateInventory =
    hasPermission(
      'inventory.update',
    ) &&
    !canEditProduct

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    inventoryOpen,
    setInventoryOpen,
  ] =
    useState(false)

  const [
    inventoryStock,
    setInventoryStock,
  ] =
    useState('')

  const [
    inventoryLocation,
    setInventoryLocation,
  ] =
    useState('')

  const [
    inventorySaving,
    setInventorySaving,
  ] =
    useState(false)

  const [
    inventoryError,
    setInventoryError,
  ] =
    useState('')

  useEffect(() => {
    const loadProduct =
      async () => {
        const productId =
          Number(id)

        if (
          !Number.isInteger(
            productId,
          ) ||
          productId <= 0
        ) {
          setError(
            'El producto solicitado no es válido.',
          )

          setLoading(false)

          return
        }

        try {
          setLoading(true)
          setError('')

          const data =
            await getProductById(
              productId,
            )

          setProduct(data)
        } catch (error) {
          console.error(
            'Error cargando producto:',
            error,
          )

          setError(
            'No fue posible cargar el producto.',
          )
        } finally {
          setLoading(false)
        }
      }

    void loadProduct()
  }, [id])

  const openInventoryModal =
    () => {
      if (!product) {
        return
      }

      setInventoryStock(
        String(
          product.stock,
        ),
      )

      setInventoryLocation(
        product.location ??
          '',
      )

      setInventoryError('')
      setInventoryOpen(true)
    }

  const closeInventoryModal =
    () => {
      if (
        inventorySaving
      ) {
        return
      }

      setInventoryOpen(false)
      setInventoryError('')
    }

  const handleInventorySubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      if (!product) {
        return
      }

      const stock =
        Number(
          inventoryStock,
        )

      if (
        !Number.isInteger(
          stock,
        ) ||
        stock < 0
      ) {
        setInventoryError(
          'Ingresa un stock válido, igual o mayor a 0.',
        )

        return
      }

      const location =
        inventoryLocation
          .trim()

      if (
        location.length >
        120
      ) {
        setInventoryError(
          'La ubicación no puede superar los 120 caracteres.',
        )

        return
      }

      try {
        setInventorySaving(
          true,
        )

        setInventoryError(
          '',
        )

        const updated =
          await updateInventory(
            product.id,
            {
              stock,
              location:
                location ||
                null,
            },
          )

        setProduct(
          updated,
        )

        setInventoryOpen(
          false,
        )
      } catch (error) {
        console.error(
          'Error actualizando inventario:',
          error,
        )

        setInventoryError(
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar el inventario.',
        )
      } finally {
        setInventorySaving(
          false,
        )
      }
    }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <div
          className="
            flex min-h-[500px]
            items-center
            justify-center
          "
        >
          <div className="text-center">
            <LoaderCircle
              size={34}
              className="
                mx-auto
                animate-spin
                text-blue-600
              "
            />

            <p className="mt-3 text-slate-500">
              Cargando producto...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (
    error ||
    !product
  ) {
    return (
      <section className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/productos',
            )
          }
          className="
            mb-6
            flex items-center
            gap-2
            text-sm
            font-medium
            text-slate-500
            transition
            hover:text-blue-600
          "
        >
          <ArrowLeft
            size={18}
          />

          Volver a productos
        </button>

        <div
          className="
            flex min-h-72
            items-center
            justify-center
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-8
            text-center
          "
        >
          <div>
            <AlertCircle
              size={34}
              className="
                mx-auto
                text-red-500
              "
            />

            <p className="mt-3 font-medium text-red-700">
              {error ||
                'Producto no encontrado.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/productos',
            )
          }
          className="
            mb-6
            flex items-center
            gap-2
            text-sm
            font-medium
            text-slate-500
            transition
            hover:text-blue-600
          "
        >
          <ArrowLeft
            size={18}
          />

          Volver a productos
        </button>

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div className="grid lg:grid-cols-2">
            <div
              className="
                flex
                min-h-[520px]
                items-center
                justify-center
                bg-slate-100
              "
            >
              {product.image ? (
                <img
                  src={
                    product.image
                  }
                  alt={
                    product.name
                  }
                  className="
                    h-full w-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    gap-3
                    text-slate-400
                  "
                >
                  <Package
                    size={64}
                    strokeWidth={
                      1.5
                    }
                  />

                  <span>
                    Sin imagen disponible
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 lg:p-10">
              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wide
                  text-blue-600
                "
              >
                {
                  product.brand
                }
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {
                  product.name
                }
              </h1>

              <p
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                $
                {product.price.toLocaleString(
                  'es-CL',
                )}
              </p>

              <div className="mt-5">
                <span
                  className={`
                    inline-flex
                    rounded-full
                    px-3 py-1.5
                    text-sm
                    font-medium

                    ${
                      product.stock ===
                      0
                        ? 'bg-red-100 text-red-700'
                        : product.stock <=
                            5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }
                  `}
                >
                  {product.stock ===
                  0
                    ? 'Sin stock'
                    : `Stock: ${product.stock}`}
                </span>
              </div>

              <p
                className="
                  mt-5
                  text-slate-600
                "
              >
                {
                  product.shortDescription
                }
              </p>

              <dl
                className="
                  mt-8
                  grid
                  grid-cols-2
                  gap-5
                  border-y
                  border-slate-200
                  py-6
                "
              >
                <div>
                  <dt className="text-sm text-slate-500">
                    SKU
                  </dt>

                  <dd
                    className="
                      mt-1
                      font-medium
                      text-slate-900
                    "
                  >
                    {
                      product.sku
                    }
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500">
                    Categoría
                  </dt>

                  <dd
                    className="
                      mt-1
                      font-medium
                      text-slate-900
                    "
                  >
                    {
                      product.category
                    }
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500">
                    Proveedor
                  </dt>

                  <dd
                    className="
                      mt-1
                      font-medium
                      text-slate-900
                    "
                  >
                    {product.supplierName ||
                      'Sin proveedor'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500">
                    Ubicación física
                  </dt>

                  <dd
                    className="
                      mt-1
                      font-medium
                      text-slate-900
                    "
                  >
                    {product.location ||
                      'Sin ubicación asignada'}
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Descripción
                </h2>

                <p
                  className="
                    mt-3
                    whitespace-pre-line
                    leading-7
                    text-slate-600
                  "
                >
                  {
                    product.description
                  }
                </p>
              </div>

              {canEditProduct && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/productos/${product.id}/editar`,
                    )
                  }
                  className="
                    mt-10
                    flex
                    items-center
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
                  <Pencil
                    size={18}
                  />

                  Editar producto
                </button>
              )}

              {canUpdateInventory && (
                <button
                  type="button"
                  onClick={
                    openInventoryModal
                  }
                  className="
                    mt-10
                    flex
                    items-center
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
                  <Pencil
                    size={18}
                  />

                  Actualizar inventario
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================
          MODAL INVENTARIO · BODEGA
      ================================== */}

      {inventoryOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-xl
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Actualizar inventario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    product.name
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeInventoryModal
                }
                disabled={
                  inventorySaving
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleInventorySubmit
              }
              className="mt-6"
            >
              <div>
                <label
                  htmlFor="inventory-stock"
                  className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Stock
                </label>

                <input
                  id="inventory-stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={
                    inventoryStock
                  }
                  onChange={(
                    event,
                  ) =>
                    setInventoryStock(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    inventorySaving
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-slate-50
                  "
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="inventory-location"
                  className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Ubicación física
                </label>

                <input
                  id="inventory-location"
                  type="text"
                  maxLength={120}
                  value={
                    inventoryLocation
                  }
                  onChange={(
                    event,
                  ) =>
                    setInventoryLocation(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej: Pasillo A · Estante 3"
                  disabled={
                    inventorySaving
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-slate-50
                  "
                />

                <p className="mt-2 text-xs text-slate-400">
                  Puedes dejarla vacía si el producto no tiene una ubicación asignada.
                </p>
              </div>

              {inventoryError && (
                <div
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4 py-3
                    text-sm
                    text-red-700
                  "
                >
                  {
                    inventoryError
                  }
                </div>
              )}

              <div
                className="
                  mt-7
                  flex
                  justify-end
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={
                    closeInventoryModal
                  }
                  disabled={
                    inventorySaving
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4 py-2.5
                    font-medium
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    inventorySaving
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-4 py-2.5
                    font-medium
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {inventorySaving && (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {inventorySaving
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductDetail