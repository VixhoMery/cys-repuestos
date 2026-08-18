import { MoreVertical } from 'lucide-react'

type ProductCardProps = {
  name: string
  brand: string
  price: number
  stock: number
  shortDescription: string
  image?: string
}

function ProductCard({
  name,
  brand,
  price,
  stock,
  shortDescription,
  image,
}: ProductCardProps) {
  return (
    <article
      className="
        group cursor-pointer
        overflow-hidden rounded-xl
        border border-slate-200
        bg-white
        transition
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="
              h-full w-full object-cover
              transition duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin imagen
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {brand}
            </p>

            <h3 className="mt-1 font-semibold text-slate-900">
              {name}
            </h3>
          </div>

          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <p className="mt-3 text-xl font-bold text-slate-900">
          ${price.toLocaleString('es-CL')}
        </p>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {shortDescription}
        </p>

        <div className="mt-4">
          <span
            className={`
              inline-flex rounded-full px-2.5 py-1
              text-xs font-medium
              ${
                stock === 0
                  ? 'bg-red-100 text-red-700'
                  : stock <= 5
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
              }
            `}
          >
            {stock === 0 ? 'Sin stock' : `Stock: ${stock}`}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ProductCard