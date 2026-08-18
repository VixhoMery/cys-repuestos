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
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-square bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-slate-500">
          {brand}
        </p>

        <h2 className="mt-1 font-semibold text-slate-900">
          {name}
        </h2>

        <p className="mt-2 text-xl font-bold text-slate-900">
          ${price.toLocaleString('es-CL')}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {shortDescription}
        </p>

        <p className="mt-3 text-sm font-medium text-slate-700">
          Stock: {stock}
        </p>
      </div>
    </article>
  )
}

export default ProductCard