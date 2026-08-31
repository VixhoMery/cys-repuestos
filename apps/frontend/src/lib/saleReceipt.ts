import {
  getPaymentDescription,
  type ReceiptSale,
} from '../api/sales'

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    )
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

export function printSaleReceipt(
  sale: ReceiptSale,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      'width=420,height=720',
    )

  if (!printWindow) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión.',
    )
  }

  const itemsHtml =
    sale.items
      .map(
        (item) => `
          <div class="item">
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="row">
              <span>${item.quantity} × ${escapeHtml(formatCurrency(item.unitPrice))}</span>
              <span>${escapeHtml(formatCurrency(item.quantity * item.unitPrice))}</span>
            </div>
          </div>
        `,
      )
      .join('')

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Comprobante venta #${sale.id}</title>

        <style>
          @page {
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            background: #fff;
            color: #000;
          }

          body {
            font-family:
              "DejaVu Sans Mono",
              "Liberation Mono",
              monospace;
            font-size: 10px;
            line-height: 1.35;
          }

          .receipt {
            width: calc(100% - 4mm);
            max-width: 48mm;
            margin: 0 auto;
            padding: 2mm 0;
          }

          .center {
            text-align: center;
          }

          .title {
            font-size: 15px;
            font-weight: 700;
          }

          .subtitle {
            margin-top: 2px;
            font-size: 11px;
            font-weight: 700;
          }

          .muted {
            margin-top: 2px;
            font-size: 9px;
          }

          .divider {
            margin: 8px 0;
            border-top: 1px dashed #000;
          }

          .line {
            margin: 2px 0;
            overflow-wrap: anywhere;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 4px;
          }

          .row span:first-child {
            min-width: 0;
            overflow-wrap: anywhere;
          }

          .row span:last-child {
            flex-shrink: 0;
            text-align: right;
          }

          .item {
            margin: 0 0 7px;
          }

          .item-name {
            margin-bottom: 1px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .total {
            font-size: 12px;
            font-weight: 700;
          }

          .notes {
            text-align: center;
            font-size: 8.5px;
            line-height: 1.3;
          }

          .notes p {
            margin: 4px 0;
          }

          .tax-note {
            font-weight: 700;
          }

          @media print {
            html,
            body {
              width: 100%;
              margin: 0;
              padding: 0;
            }

            .receipt {
              width: calc(100% - 4mm);
              max-width: 48mm;
              margin-left: auto;
              margin-right: auto;
            }
          }
        </style>
      </head>

      <body>
        <main class="receipt">
          <header class="center">
            <div class="title">C&amp;S REPUESTOS</div>
            <div class="subtitle">Comprobante de compra / garantía</div>
            <div class="muted">Documento interno</div>
          </header>

          <div class="divider"></div>

          <section>
            <div class="line"><strong>Venta:</strong> #${sale.id}</div>
            <div class="line"><strong>Fecha:</strong> ${escapeHtml(formatDateTime(sale.soldAt))}</div>
            <div class="line"><strong>Vendedor:</strong> ${escapeHtml(sale.seller)}</div>
            <div class="line"><strong>Pago:</strong> ${escapeHtml(getPaymentDescription(sale.paymentMethod, sale.installments))}</div>
          </section>

          <div class="divider"></div>

          <section>
            ${itemsHtml}
          </section>

          <div class="divider"></div>

          <div class="row total">
            <span>TOTAL</span>
            <span>${escapeHtml(formatCurrency(sale.total))}</span>
          </div>

          <div class="divider"></div>

          <footer class="notes">
            <p>
              Conserve este comprobante para acreditar la compra ante cambios o garantías.
            </p>

            <p>
              Las garantías y cambios se rigen por la normativa y condiciones vigentes.
            </p>

            <p class="tax-note">
              Este documento no reemplaza una boleta o factura tributaria.
            </p>
          </footer>
        </main>

        <script>
          window.addEventListener('load', () => {
            window.setTimeout(() => {
              window.print();
            }, 100);
          });

          window.addEventListener('afterprint', () => {
            window.close();
          });
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(
    html,
  )
  printWindow.document.close()
}
