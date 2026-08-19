import {
  Minus,
  Plus,
  Trash2,
} from 'lucide-react'

type CartItemProps = {
  name: string
  price: number
  quantity: number
  stock: number

  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}

function CartItem({
  name,
  price,
  quantity,
  stock,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-900">
            {name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            ${price.toLocaleString('es-CL')} c/u
          </p>
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
          >
            <Minus size={15} />
          </button>

          <span className="w-8 text-center font-medium">
            {quantity}
          </span>

          <button
            type="button"
            onClick={onIncrease}
            disabled={quantity >= stock}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg border border-slate-300
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
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