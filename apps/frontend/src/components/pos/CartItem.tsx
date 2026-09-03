import {
  Minus,
  Plus,
  Trash2,
} from 'lucide-react'

type CartItemProps = {
  name: string
  price: number
  quantity: number
  stock:
    | number
    | null

  itemType?:
    | 'inventory'
    | 'temporary'

  netPrice?:
    | number
    | null

  priceWithTax?:
    | number
    | null

  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}

function CartItem({
  name,
  price,
  quantity,
  stock,
  itemType = 'inventory',
  netPrice = null,
  priceWithTax = null,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  const isTemporary =
    itemType ===
    'temporary'

  const increaseDisabled =
    !isTemporary &&
    stock !== null &&
    quantity >= stock

  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-slate-900">
              {name}
            </h3>

            {isTemporary && (
              <span
                className="
                  inline-flex
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
            ${price.toLocaleString('es-CL')} c/u
          </p>

          {isTemporary &&
            netPrice !== null &&
            priceWithTax !== null && (
              <p className="mt-1 text-xs text-slate-400">
                Neto ${netPrice.toLocaleString('es-CL')}
                {' · '}
                Con IVA ${priceWithTax.toLocaleString('es-CL')}
              </p>
            )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="
            self-start rounded-lg p-2
            text-slate-400
            transition
            hover:bg-red-50
            hover:text-red-600
          "
          aria-label={`Eliminar ${name} de la venta`}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg border border-slate-300
              hover:bg-slate-100
            "
            aria-label={`Disminuir cantidad de ${name}`}
          >
            <Minus size={15} />
          </button>

          <span className="w-8 text-center font-medium">
            {quantity}
          </span>

          <button
            type="button"
            onClick={onIncrease}
            disabled={increaseDisabled}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg border border-slate-300
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label={`Aumentar cantidad de ${name}`}
          >
            <Plus size={15} />
          </button>
        </div>

        <p className="font-semibold text-slate-900">
          $
          {(price * quantity).toLocaleString(
            'es-CL',
          )}
        </p>
      </div>
    </div>
  )
}

export default CartItem
