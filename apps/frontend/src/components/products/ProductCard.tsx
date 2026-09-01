import {
  useState,
} from 'react'

import {
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

type ProductCardProps = {
  id: number
  name: string
  brand: string
  price: number
  stock: number
  shortDescription: string
  image?: string

  canEdit?: boolean
  canDelete?: boolean

  onDelete?: (
    id: number,
    name: string,
  ) => void
}

function ProductCard({
  id,
  name,
  brand,
  price,
  stock,
  shortDescription,
  image,
  canEdit = false,
  canDelete = false,
  onDelete,
}: ProductCardProps) {
  const navigate =
    useNavigate()

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false)

  const showMenu =
    canEdit ||
    (
      canDelete &&
      !!onDelete
    )

  return (
    <article
      onClick={() =>
        navigate(
          `/productos/${id}`,
        )
      }
      className="
        group relative cursor-pointer
        overflow-visible rounded-xl
        border border-slate-200
        bg-white
        transition
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden rounded-t-xl bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {brand}
            </p>

            <h3 className="mt-1 font-semibold text-slate-900">
              {name}
            </h3>
          </div>

          {showMenu && (
            <div className="relative">
              <button
                type="button"
                onClick={(
                  event,
                ) => {
                  event.stopPropagation()

                  setMenuOpen(
                    (open) =>
                      !open,
                  )
                }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Opciones del producto"
              >
                <MoreVertical
                  size={19}
                />
              </button>

              {menuOpen && (
                <div
                  onClick={(
                    event,
                  ) =>
                    event.stopPropagation()
                  }
                  className="
                    absolute right-0 top-9 z-20
                    w-44 overflow-hidden
                    rounded-lg border border-slate-200
                    bg-white shadow-lg
                  "
                >
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/productos/${id}/editar`,
                        )
                      }
                      className="
                        flex w-full items-center gap-2
                        px-4 py-3 text-left
                        text-sm text-slate-700
                        transition hover:bg-slate-100
                      "
                    >
                      <Pencil
                        size={16}
                      />

                      Editar producto
                    </button>
                  )}

                  {canDelete &&
                    onDelete && (
                      <button
                        type="button"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation()

                          setMenuOpen(
                            false,
                          )

                          onDelete(
                            id,
                            name,
                          )
                        }}
                        className={`
                          flex w-full items-center gap-2
                          px-4 py-3 text-left
                          text-sm text-red-600
                          transition hover:bg-red-50

                          ${
                            canEdit
                              ? 'border-t border-slate-100'
                              : ''
                          }
                        `}
                      >
                        <Trash2
                          size={16}
                        />

                        Eliminar producto
                      </button>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xl font-bold text-slate-900">
          $
          {price.toLocaleString(
            'es-CL',
          )}
        </p>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {shortDescription}
        </p>

        <div className="mt-4">
          <span
            className={`
              inline-flex rounded-full
              px-2.5 py-1
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
            {stock === 0
              ? 'Sin stock'
              : `Stock: ${stock}`}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ProductCard