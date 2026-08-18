import { ArrowLeft, Pencil, Package } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

const product = {
  id: 1,
  name: 'Alternador Toyota Yaris',
  brand: 'Bosch',
  sku: 'ALT-YAR-001',
  category: 'Motor',
  price: 180000,
  stock: 4,

  shortDescription:
    'Alternador compatible con Toyota Yaris modelos 2006–2012.',

  description:
    'Alternador Bosch de 12V compatible con Toyota Yaris modelos 2006–2012. Diseñado para proporcionar una carga estable al sistema eléctrico del vehículo. Se recomienda verificar compatibilidad mediante SKU y modelo antes de realizar la instalación.',

  image: undefined,
}

function ProductDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  console.log('Producto seleccionado:', id)

  return (
    <section className="mx-auto max-w-6xl">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate('/productos')}
        className="
          mb-6 flex items-center gap-2
          text-sm font-medium text-slate-500
          transition hover:text-blue-600
        "
      >
        <ArrowLeft size={18} />
        Volver a productos
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-2">
          {/* Imagen */}
          <div className="flex min-h-[450px] items-center justify-center bg-slate-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Package size={64} strokeWidth={1.5} />
                <span>Sin imagen disponible</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              {product.brand}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {product.name}
            </h1>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              ${product.price.toLocaleString('es-CL')}
            </p>

            {/* Stock */}
            <div className="mt-5">
              <span
                className={`
                  inline-flex rounded-full px-3 py-1.5
                  text-sm font-medium
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

            {/* Información adicional */}
            <dl className="mt-8 grid grid-cols-2 gap-5 border-y border-slate-200 py-6">
              <div>
                <dt className="text-sm text-slate-500">
                  SKU
                </dt>

                <dd className="mt-1 font-medium text-slate-900">
                  {product.sku}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Categoría
                </dt>

                <dd className="mt-1 font-medium text-slate-900">
                  {product.category}
                </dd>
              </div>
            </dl>

            {/* Descripción */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                Descripción
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {product.description}
              </p>
            </div>

            {/* Editar */}
            <button
              type="button"
              onClick={() =>
                navigate(`/productos/${product.id}/editar`)
              }
              className="
                mt-10 flex items-center gap-2
                rounded-xl bg-blue-600
                px-5 py-3
                font-medium text-white
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