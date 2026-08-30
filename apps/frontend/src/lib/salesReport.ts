import {
  getPaymentDescription,
  type Sale,
} from '../api/sales'


function formatCurrency(
  amount: number,
) {
  return `$${amount.toLocaleString(
    'es-CL',
  )}`
}


function formatDateTimeParts(
  date: string,
) {
  const value =
    new Date(date)

  return {
    date:
      new Intl.DateTimeFormat(
        'es-CL',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        },
      ).format(value),

    time:
      new Intl.DateTimeFormat(
        'es-CL',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      ).format(value),
  }
}


function csvCell(
  value:
    | string
    | number
    | null
    | undefined,
) {
  let text =
    String(
      value ?? '',
    )

  if (
    typeof value === 'string' &&
    (
      /^[\t\r\n]/.test(text) ||
      /^\s*[=+\-@]/.test(text)
    )
  ) {
    text = `'${text}`
  }

  return `"${text.replaceAll(
    '"',
    '""',
  )}"`
}


function safeFilePart(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      '-',
    )
    .replace(
      /-+/g,
      '-',
    )
    .replace(
      /^-|-$/g,
      '',
    )
    .toLowerCase()
}


export function exportSalesReportCsv(
  sales: Sale[],
  periodLabel: string,
) {
  const rows: Array<
    Array<
      string | number
    >
  > = [
    [
      'Venta',
      'Fecha',
      'Hora',
      'Vendedor',
      'Método de pago',
      'Cuotas',
      'Producto',
      'Cantidad',
      'Precio unitario',
      'Subtotal',
      'Total venta',
    ],
  ]

  sales.forEach(
    (sale) => {
      const dateParts =
        formatDateTimeParts(
          sale.soldAt,
        )

      sale.items.forEach(
        (item) => {
          rows.push([
            sale.id,
            dateParts.date,
            dateParts.time,
            sale.seller,
            getPaymentDescription(
              sale.paymentMethod,
              sale.installments,
            ),
            sale.paymentMethod ===
              'credito'
              ? sale.installments ??
                ''
              : '',
            item.name,
            item.quantity,
            item.unitPrice,
            item.unitPrice *
              item.quantity,
            sale.total,
          ])
        },
      )
    },
  )

  const csv =
    rows
      .map(
        (row) =>
          row
            .map(csvCell)
            .join(';'),
      )
      .join('\n')

  const blob =
    new Blob(
      [
        '\uFEFF',
        csv,
      ],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    )

  const url =
    URL.createObjectURL(
      blob,
    )

  const anchor =
    document.createElement(
      'a',
    )

  const periodFile =
    safeFilePart(
      periodLabel,
    ) ||
    'periodo'

  anchor.href = url
  anchor.download =
    `reporte-ventas-${periodFile}.csv`

  document.body.appendChild(
    anchor,
  )

  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(
    url,
  )
}


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


export function printSalesReport(
  sales: Sale[],
  periodLabel: string,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      'width=980,height=760',
    )

  if (!printWindow) {
    throw new Error(
      'El navegador bloqueó la ventana del reporte.',
    )
  }

  const totalSold =
    sales.reduce(
      (sum, sale) =>
        sum + sale.total,
      0,
    )

  const unitsSold =
    sales.reduce(
      (
        saleTotal,
        sale,
      ) =>
        saleTotal +
        sale.items.reduce(
          (
            itemTotal,
            item,
          ) =>
            itemTotal +
            item.quantity,
          0,
        ),
      0,
    )

  const averageSale =
    sales.length > 0
      ? Math.round(
          totalSold /
            sales.length,
        )
      : 0

  const paymentMap =
    new Map<
      string,
      {
        count: number
        total: number
      }
    >()

  sales.forEach(
    (sale) => {
      const label =
        getPaymentDescription(
          sale.paymentMethod,
          sale.installments,
        )

      const current =
        paymentMap.get(
          label,
        ) ?? {
          count: 0,
          total: 0,
        }

      current.count += 1
      current.total +=
        sale.total

      paymentMap.set(
        label,
        current,
      )
    },
  )

  const paymentRows =
    Array.from(
      paymentMap.entries(),
    )
      .sort(
        (
          a,
          b,
        ) =>
          b[1].total -
          a[1].total,
      )
      .map(
        (
          [
            label,
            value,
          ],
        ) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>${value.count}</td>
            <td>${escapeHtml(formatCurrency(value.total))}</td>
          </tr>
        `,
      )
      .join('')

  const saleRows =
    sales
      .map(
        (sale) => {
          const dateParts =
            formatDateTimeParts(
              sale.soldAt,
            )

          const products =
            sale.items
              .map(
                (item) =>
                  `${item.quantity}× ${escapeHtml(item.name)}`,
              )
              .join(
                '<br />',
              )

          return `
            <tr>
              <td>#${sale.id}</td>
              <td>${escapeHtml(dateParts.date)} ${escapeHtml(dateParts.time)}</td>
              <td>${escapeHtml(sale.seller)}</td>
              <td>${escapeHtml(getPaymentDescription(sale.paymentMethod, sale.installments))}</td>
              <td>${products}</td>
              <td class="money">${escapeHtml(formatCurrency(sale.total))}</td>
            </tr>
          `
        },
      )
      .join('')

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte de ventas - ${escapeHtml(periodLabel)}</title>

        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #0f172a;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 11px;
          }

          h1,
          h2,
          p {
            margin: 0;
          }

          .header {
            padding-bottom: 14px;
            border-bottom: 2px solid #0f172a;
          }

          .brand {
            font-size: 22px;
            font-weight: 700;
          }

          .subtitle {
            margin-top: 4px;
            color: #475569;
            font-size: 13px;
          }

          .period {
            margin-top: 4px;
            font-weight: 700;
          }

          .summary {
            display: grid;
            grid-template-columns:
              repeat(
                4,
                1fr
              );
            gap: 8px;
            margin: 14px 0;
          }

          .card {
            padding: 10px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
          }

          .card-label {
            color: #64748b;
            font-size: 9px;
            text-transform: uppercase;
          }

          .card-value {
            margin-top: 4px;
            font-size: 15px;
            font-weight: 700;
          }

          h2 {
            margin:
              16px 0 7px;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f1f5f9;
            font-size: 9px;
            text-transform: uppercase;
          }

          .money {
            white-space: nowrap;
            font-weight: 700;
          }

          .footer {
            margin-top: 14px;
            color: #64748b;
            font-size: 9px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <header class="header">
          <div class="brand">C&amp;S Repuestos</div>
          <div class="subtitle">Reporte de ventas</div>
          <div class="period">${escapeHtml(periodLabel)}</div>
        </header>

        <section class="summary">
          <div class="card">
            <div class="card-label">Total vendido</div>
            <div class="card-value">${escapeHtml(formatCurrency(totalSold))}</div>
          </div>

          <div class="card">
            <div class="card-label">Ventas</div>
            <div class="card-value">${sales.length}</div>
          </div>

          <div class="card">
            <div class="card-label">Unidades</div>
            <div class="card-value">${unitsSold}</div>
          </div>

          <div class="card">
            <div class="card-label">Venta promedio</div>
            <div class="card-value">${escapeHtml(formatCurrency(averageSale))}</div>
          </div>
        </section>

        <h2>Resumen por método de pago</h2>

        <table>
          <thead>
            <tr>
              <th>Método</th>
              <th>Ventas</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${paymentRows || `
              <tr>
                <td colspan="3">
                  Sin ventas en el período.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <h2>Detalle de ventas</h2>

        <table>
          <thead>
            <tr>
              <th>Venta</th>
              <th>Fecha</th>
              <th>Vendedor</th>
              <th>Pago</th>
              <th>Productos</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${saleRows || `
              <tr>
                <td colspan="6">
                  Sin ventas en el período.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <p class="footer">
          Generado desde el sistema interno C&amp;S Repuestos.
          Para obtener PDF, selecciona “Guardar como PDF” en el diálogo de impresión.
        </p>

        <script>
          window.addEventListener(
            'load',
            () => {
              window.setTimeout(
                () => {
                  window.print();
                },
                100,
              );
            },
          );
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
