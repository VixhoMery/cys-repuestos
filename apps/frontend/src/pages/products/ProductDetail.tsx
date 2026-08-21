import {
  useEffect,
  useState,
} from 'react'

import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  Package,
  Pencil,
} from 'lucide-react'

import {
  useNavigate,
  useParams,
} from 'react-router'

import {
  getProductById,
  type Product,
} from '../../api/products'


function ProductDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [product, setProduct] =
    useState<Product | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ------------------------------------
  // Cargar producto desde backend
  // ------------------------------------

  useEffect(() => {
    const loadProduct = async () => {
      const productId = Number(id)

      if (
        !Number.isInteger(productId) ||
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

    loadProduct()
  }, [id])


  // ------------------------------------
  // Cargando
  // ------------------------------------

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <div
          className="
            flex min-h-[500px]
            items-center justify-center
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


  // ------------------------------------
  // Error
  // ------------------------------------

  if (error || !product) {
    return (
      <section className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            navigate('/productos')
          }
          className="
            mb-6 flex items-center gap-2
            text-sm font-medium
            text-slate-500
            transition
            hover:text-blue-600
          "
        >
          <ArrowLeft size={18} />

          Volver a productos
        </button>

        <div
          className="
            flex min-h-72
            items-center justify-center
            rounded-2xl
            border border-red-200
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


  // ------------------------------------
  // Producto
  // ------------------------------------

  return (
    <section className="mx-auto max-w-6xl">

      {/* Volver */}
      <button
        type="button"
        onClick={() =>
          navigate('/productos')
        }
        className="
          mb-6 flex items-center gap-2
          text-sm font-medium text-slate-500
          transition
          hover:text-blue-600
        "
      >
        <ArrowLeft size={18} />

        Volver a productos
      </button>


      <div
        className="
          overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-sm
        "
      >
        <div className="grid lg:grid-cols-2">

          {/* Imagen */}
          <div
            className="
              flex min-h-[520px]
              items-center justify-center
              bg-slate-100
            "
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="
                  h-full w-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex flex-col
                  items-center gap-3
                  text-slate-400
                "
              >
                <Package
                  size={64}
                  strokeWidth={1.5}
                />

                <span>
                  Sin imagen disponible
                </span>
              </div>
            )}
          </div>


          {/* Información */}
          <div className="p-8 lg:p-10">

            {/* Marca */}
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-wide
                text-blue-600
              "
            >
              {product.brand}
            </p>


            {/* Nombre */}
            <h1
              className="
                mt-2
                text-3xl
                font-bold
                text-slate-900
              "
            >
              {product.name}
            </h1>


            {/* Precio */}
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


            {/* Stock */}
            <div className="mt-5">
              <span
                className={`
                  inline-flex
                  rounded-full
                  px-3 py-1.5
                  text-sm
                  font-medium

                  ${
                    product.stock === 0
                      ? 'bg-red-100 text-red-700'
                      : product.stock <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                  }
                `}
              >
                {product.stock === 0
                  ? 'Sin stock'
                  : `Stock: ${product.stock}`}
              </span>
            </div>


            {/* Descripción corta */}
            <p
              className="
                mt-5
                text-slate-600
              "
            >
              {product.shortDescription}
            </p>


            {/* Información adicional */}
            <dl
              className="
                mt-8 grid
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
                  {product.sku}
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
                  {product.category}
                </dd>
              </div>
            </dl>


            {/* Descripción */}
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
                {product.description}
              </p>
            </div>


            {/* Editar */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/productos/${product.id}/editar`,
                )
              }
              className="
                mt-10
                flex items-center
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
              <Pencil size={18} />

              Editar producto
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductDetail