type ProductCardProps = {
  name: string
  price: number
  stock: number
  image?: string
}

function ProductCard({
  name,
  price,
  stock,
  image,
}: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-square bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <h2 className="font-semibold text-slate-800">
          {name}
        </h2>

        <p className="mt-2 text-xl font-bold text-slate-900">
          ${price.toLocaleString('es-CL')}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Stock: {stock}
        </p>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
            Editar
          </button>

          <button className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">
            Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard