import {
  getPaymentDescription,
  type ReceiptSale,
} from '../../api/sales'

type SaleReceiptProps = {
  sale: ReceiptSale
}

function formatCurrency(
  amount: number,
) {
  return `$${amount.toLocaleString(
    'es-CL',
  )}`
}

function formatDateTime(
  date: string,
) {
  return new Intl.DateTimeFormat(
    'es-CL',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(date))
}

function SaleReceipt({
  sale,
}: SaleReceiptProps) {
  return (
    <div
      className="
        mx-auto w-full max-w-sm
        rounded-xl
        border border-slate-200
        bg-white
        px-5 py-6
        font-mono
        text-[12px]
        leading-5
        text-slate-900
      "
    >
      <div className="text-center">
        <p className="text-base font-bold">
          C&S REPUESTOS
        </p>

        <p className="mt-1 font-semibold">
          Comprobante de compra / garantía
        </p>

        <p className="mt-1 text-[11px] text-slate-500">
          Documento interno
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1">
        <p>
          <span className="font-semibold">
            Venta:
          </span>{' '}
          #{sale.id}
        </p>

        <p>
          <span className="font-semibold">
            Fecha:
          </span>{' '}
          {formatDateTime(
            sale.soldAt,
          )}
        </p>

        <p className="break-all">
          <span className="font-semibold">
            Vendedor:
          </span>{' '}
          {sale.seller}
        </p>

        <p>
          <span className="font-semibold">
            Pago:
          </span>{' '}
          {getPaymentDescription(
            sale.paymentMethod,
            sale.installments,
          )}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-3">
        {sale.items.map(
          (item, index) => (
            <div
              key={`${item.name}-${index}`}
            >
              <p className="font-semibold">
                {item.name}
              </p>

              <div className="flex justify-between gap-4">
                <span>
                  {item.quantity} ×{' '}
                  {formatCurrency(
                    item.unitPrice,
                  )}
                </span>

                <span>
                  {formatCurrency(
                    item.quantity *
                      item.unitPrice,
                  )}
                </span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="flex items-center justify-between text-sm font-bold">
        <span>TOTAL</span>

        <span>
          {formatCurrency(
            sale.total,
          )}
        </span>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-2 text-center text-[10px] leading-4 text-slate-500">
        <p>
          Conserve este comprobante para acreditar la compra ante cambios o garantías.
        </p>

        <p>
          Las garantías y cambios se rigen por la normativa y condiciones vigentes.
        </p>

        <p className="font-semibold text-slate-600">
          Este documento no reemplaza una boleta o factura tributaria.
        </p>
      </div>
    </div>
  )
}

export default SaleReceipt
