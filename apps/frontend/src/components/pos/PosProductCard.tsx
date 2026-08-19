type PosProductCardProps = {
  id: number
  name: string
  brand: string
  price: number
  stock: number
  image?: string
  onAdd: (id: number) => void
}

function PosProductCard({
  id,
  name,
  brand,
  price,
  stock,
  image,
  onAdd,
}: PosProductCardProps) {
  const outOfStock = stock === 0

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(id)}
      className="
        group overflow-hidden rounded-xl
        border border-slate-200
        bg-white text-left
        transition
        hover:-translate-y-1
        hover:shadow-md
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
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

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {brand}
        </p>

        <h3 className="mt-1 font-semibold text-slate-900">
          {name}
        </h3>

        <p className="mt-3 text-xl font-bold text-slate-900">
          ${price.toLocaleString('es-CL')}
        </p>

        <p
          className={`
            mt-2 text-sm font-medium
            ${
              outOfStock
                ? 'text-red-600'
                : stock <= 5
                  ? 'text-amber-600'
                  : 'text-slate-500'
            }
          `}
        >
          {outOfStock
            ? 'Sin stock'
            : `Stock: ${stock}`}
        </p>
      </div>
    </button>
  )
}

export default PosProductCard