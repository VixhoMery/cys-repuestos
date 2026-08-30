import {
  createClient,
} from 'npm:@supabase/supabase-js@2'

const REPORT_TIME_ZONE =
  'America/Santiago'

type MonthlySnapshotSale = {
  id: number
  seller: string
  soldAt: string
  total: number
  paymentMethod: string | null
  installments: number | null
  items: Array<{
    productId: number | null
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

type MonthlySnapshot = {
  periodKey: string
  periodStartLocal: string
  periodEndLocal: string
  timezone: string
  sales: MonthlySnapshotSale[]
}

function response(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'content-type':
          'application/json; charset=utf-8',
      },
    },
  )
}

function requiredEnv(
  name: string,
) {
  const value =
    Deno.env.get(name)?.trim()

  if (!value) {
    throw new Error(
      `Falta el secreto ${name}.`,
    )
  }

  return value
}

function getSupabaseSecretKey() {
  const keysJson =
    Deno.env.get(
      'SUPABASE_SECRET_KEYS',
    )

  if (keysJson) {
    const parsed =
      JSON.parse(
        keysJson,
      ) as Record<
        string,
        string
      >

    const key =
      parsed.default ??
      Object.values(
        parsed,
      )[0]

    if (key) {
      return key
    }
  }

  const legacy =
    Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    )

  if (legacy) {
    return legacy
  }

  throw new Error(
    'Supabase no expuso una clave secreta para la Edge Function.',
  )
}

async function digest(
  value: string,
) {
  return new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(
        value,
      ),
    ),
  )
}

async function safeEqual(
  left: string,
  right: string,
) {
  const [
    leftDigest,
    rightDigest,
  ] =
    await Promise.all([
      digest(left),
      digest(right),
    ])

  if (
    leftDigest.length !==
    rightDigest.length
  ) {
    return false
  }

  let difference = 0

  for (
    let index = 0;
    index <
    leftDigest.length;
    index += 1
  ) {
    difference |=
      leftDigest[index] ^
      rightDigest[index]
  }

  return difference === 0
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

function formatCurrency(
  amount: number,
) {
  return `$${amount.toLocaleString(
    'es-CL',
  )}`
}

function paymentLabel(
  paymentMethod:
    | string
    | null,
  installments:
    | number
    | null,
) {
  const labels:
    Record<
      string,
      string
    > = {
      efectivo:
        'Efectivo',
      debito:
        'Débito',
      credito:
        'Crédito',
      transferencia:
        'Transferencia',
      otro:
        'Otro',
    }

  if (!paymentMethod) {
    return 'No registrado'
  }

  const label =
    labels[paymentMethod] ??
    paymentMethod

  if (
    paymentMethod !==
    'credito'
  ) {
    return label
  }

  if (!installments) {
    return `${label} · cuotas no registradas`
  }

  return `${label} · ${installments} ${
    installments === 1
      ? 'cuota'
      : 'cuotas'
  }`
}

function monthLabel(
  periodKey: string,
) {
  const [
    yearText,
    monthText,
  ] =
    periodKey.split('-')

  const year =
    Number(yearText)

  const month =
    Number(monthText)

  return new Intl.DateTimeFormat(
    'es-CL',
    {
      month: 'long',
      year: 'numeric',
      timeZone:
        REPORT_TIME_ZONE,
    },
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        15,
      ),
    ),
  )
}

function utf8ToBase64(
  value: string,
) {
  const bytes =
    new TextEncoder()
      .encode(value)

  let binary = ''

  const chunkSize =
    0x8000

  for (
    let index = 0;
    index <
    bytes.length;
    index += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        index,
        Math.min(
          index +
            chunkSize,
          bytes.length,
        ),
      )

    binary +=
      String.fromCharCode(
        ...chunk,
      )
  }

  return btoa(binary)
}

function csvCell(
  value:
    | string
    | number
    | null
    | undefined,
) {
  return `"${String(
    value ?? '',
  ).replaceAll(
    '"',
    '""',
  )}"`
}

function buildCsv(
  snapshot:
    MonthlySnapshot,
) {
  const rows: Array<
    Array<
      string | number
    >
  > = [
    [
      'Venta',
      'Fecha',
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

  snapshot.sales.forEach(
    (sale) => {
      const soldAt =
        new Intl.DateTimeFormat(
          'es-CL',
          {
            dateStyle:
              'short',
            timeStyle:
              'short',
            timeZone:
              REPORT_TIME_ZONE,
          },
        ).format(
          new Date(
            sale.soldAt,
          ),
        )

      sale.items.forEach(
        (item) => {
          rows.push([
            sale.id,
            soldAt,
            sale.seller,
            paymentLabel(
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
            item.subtotal,
            sale.total,
          ])
        },
      )
    },
  )

  return (
    '\uFEFF' +
    rows
      .map(
        (row) =>
          row
            .map(
              csvCell,
            )
            .join(';'),
      )
      .join('\n')
  )
}

function buildSummary(
  snapshot:
    MonthlySnapshot,
) {
  const sales =
    snapshot.sales

  const total =
    sales.reduce(
      (
        sum,
        sale,
      ) =>
        sum +
        sale.total,
      0,
    )

  const units =
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

  const average =
    sales.length > 0
      ? Math.round(
          total /
            sales.length,
        )
      : 0

  const paymentMap =
    new Map<
      string,
      {
        sales: number
        total: number
      }
    >()

  const productMap =
    new Map<
      string,
      {
        units: number
        total: number
      }
    >()

  const sellerMap =
    new Map<
      string,
      {
        sales: number
        total: number
      }
    >()

  sales.forEach(
    (sale) => {
      const payment =
        paymentLabel(
          sale.paymentMethod,
          sale.installments,
        )

      const currentPayment =
        paymentMap.get(
          payment,
        ) ?? {
          sales: 0,
          total: 0,
        }

      currentPayment.sales +=
        1
      currentPayment.total +=
        sale.total

      paymentMap.set(
        payment,
        currentPayment,
      )

      const currentSeller =
        sellerMap.get(
          sale.seller,
        ) ?? {
          sales: 0,
          total: 0,
        }

      currentSeller.sales +=
        1
      currentSeller.total +=
        sale.total

      sellerMap.set(
        sale.seller,
        currentSeller,
      )

      sale.items.forEach(
        (item) => {
          const currentProduct =
            productMap.get(
              item.name,
            ) ?? {
              units: 0,
              total: 0,
            }

          currentProduct.units +=
            item.quantity
          currentProduct.total +=
            item.subtotal

          productMap.set(
            item.name,
            currentProduct,
          )
        },
      )
    },
  )

  const paymentStats =
    Array.from(
      paymentMap.entries(),
    ).sort(
      (
        a,
        b,
      ) =>
        b[1].total -
        a[1].total,
    )

  const topProducts =
    Array.from(
      productMap.entries(),
    )
      .sort(
        (
          a,
          b,
        ) =>
          b[1].units -
          a[1].units,
      )
      .slice(
        0,
        5,
      )

  const topSellers =
    Array.from(
      sellerMap.entries(),
    )
      .sort(
        (
          a,
          b,
        ) =>
          b[1].total -
          a[1].total,
      )
      .slice(
        0,
        5,
      )

  return {
    total,
    units,
    average,
    salesCount:
      sales.length,
    paymentStats,
    topProducts,
    topSellers,
  }
}

function buildEmailHtml(
  snapshot:
    MonthlySnapshot,
) {
  const summary =
    buildSummary(
      snapshot,
    )

  const label =
    monthLabel(
      snapshot.periodKey,
    )

  const paymentRows =
    summary.paymentStats
      .map(
        (
          [
            payment,
            value,
          ],
        ) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(payment)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${value.sales}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${escapeHtml(formatCurrency(value.total))}</td>
          </tr>
        `,
      )
      .join('')

  const productRows =
    summary.topProducts
      .map(
        (
          [
            product,
            value,
          ],
        ) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(product)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${value.units}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${escapeHtml(formatCurrency(value.total))}</td>
          </tr>
        `,
      )
      .join('')

  const sellerRows =
    summary.topSellers
      .map(
        (
          [
            seller,
            value,
          ],
        ) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(seller)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${value.sales}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${escapeHtml(formatCurrency(value.total))}</td>
          </tr>
        `,
      )
      .join('')

  return `
    <!doctype html>
    <html lang="es">
      <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
        <div style="max-width:760px;margin:0 auto;padding:28px 16px">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
            <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
              <div style="font-size:22px;font-weight:700">C&amp;S Repuestos</div>
              <div style="margin-top:6px;color:#64748b">Reporte mensual de ventas</div>
              <div style="margin-top:4px;font-size:14px;font-weight:600;text-transform:capitalize">${escapeHtml(label)}</div>
            </div>

            <div style="padding:24px 28px">
              <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:8px">
                <tr>
                  <td style="padding:14px;border:1px solid #e2e8f0;border-radius:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase">Total vendido</div>
                    <div style="margin-top:5px;font-size:20px;font-weight:700">${escapeHtml(formatCurrency(summary.total))}</div>
                  </td>

                  <td style="padding:14px;border:1px solid #e2e8f0;border-radius:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase">Ventas</div>
                    <div style="margin-top:5px;font-size:20px;font-weight:700">${summary.salesCount}</div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px;border:1px solid #e2e8f0;border-radius:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase">Unidades</div>
                    <div style="margin-top:5px;font-size:20px;font-weight:700">${summary.units}</div>
                  </td>

                  <td style="padding:14px;border:1px solid #e2e8f0;border-radius:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase">Venta promedio</div>
                    <div style="margin-top:5px;font-size:20px;font-weight:700">${escapeHtml(formatCurrency(summary.average))}</div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:26px 0 8px;font-size:16px">Métodos de pago</h2>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="background:#f8fafc">
                    <th style="padding:8px;text-align:left">Método</th>
                    <th style="padding:8px;text-align:right">Ventas</th>
                    <th style="padding:8px;text-align:right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRows || `
                    <tr>
                      <td colspan="3" style="padding:10px;color:#64748b">
                        Sin ventas en el período.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              <h2 style="margin:26px 0 8px;font-size:16px">Productos más vendidos</h2>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="background:#f8fafc">
                    <th style="padding:8px;text-align:left">Producto</th>
                    <th style="padding:8px;text-align:right">Unidades</th>
                    <th style="padding:8px;text-align:right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows || `
                    <tr>
                      <td colspan="3" style="padding:10px;color:#64748b">
                        Sin ventas en el período.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              <h2 style="margin:26px 0 8px;font-size:16px">Ventas por vendedor</h2>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="background:#f8fafc">
                    <th style="padding:8px;text-align:left">Vendedor</th>
                    <th style="padding:8px;text-align:right">Ventas</th>
                    <th style="padding:8px;text-align:right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${sellerRows || `
                    <tr>
                      <td colspan="3" style="padding:10px;color:#64748b">
                        Sin ventas en el período.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              <p style="margin:26px 0 0;color:#64748b;font-size:12px;line-height:1.5">
                El detalle completo de las ventas va adjunto en formato CSV.
                El período se calcula según la zona horaria America/Santiago.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

async function main(
  request: Request,
) {
  if (
    request.method !==
    'POST'
  ) {
    return response(
      {
        error:
          'Método no permitido.',
      },
      405,
    )
  }

  const expectedSecret =
    requiredEnv(
      'REPORT_CRON_SECRET',
    )

  const receivedSecret =
    request.headers.get(
      'x-cys-report-secret',
    ) ?? ''

  if (
    !receivedSecret ||
    !await safeEqual(
      receivedSecret,
      expectedSecret,
    )
  ) {
    return response(
      {
        error:
          'No autorizado.',
      },
      401,
    )
  }

  let body:
    Record<
      string,
      unknown
    > = {}

  try {
    body =
      await request.json()
  } catch {
    body = {}
  }

  const dryRun =
    body.dryRun === true

  const force =
    body.force === true

  const supabaseUrl =
    requiredEnv(
      'SUPABASE_URL',
    )

  const supabase =
    createClient(
      supabaseUrl,
      getSupabaseSecretKey(),
      {
        auth: {
          persistSession:
            false,
          autoRefreshToken:
            false,
        },
      },
    )

  const {
    data:
      snapshotData,
    error:
      snapshotError,
  } =
    await supabase.rpc(
      'cys_monthly_report_snapshot',
    )

  if (snapshotError) {
    console.error(
      'Error generando snapshot mensual:',
      snapshotError,
    )

    return response(
      {
        error:
          'No fue posible generar el reporte mensual.',
      },
      500,
    )
  }

  const snapshot =
    snapshotData as
      MonthlySnapshot

  const recipients =
    requiredEnv(
      'REPORT_EMAIL_TO',
    )
      .split(',')
      .map(
        (value) =>
          value.trim(),
      )
      .filter(Boolean)

  if (
    recipients.length ===
    0
  ) {
    return response(
      {
        error:
          'REPORT_EMAIL_TO no contiene destinatarios.',
      },
      500,
    )
  }

  const recipientKey =
    recipients
      .map(
        (value) =>
          value.toLowerCase(),
      )
      .sort()
      .join(',')

  const summary =
    buildSummary(
      snapshot,
    )

  if (dryRun) {
    return response({
      status:
        'dry-run',
      periodKey:
        snapshot.periodKey,
      period:
        monthLabel(
          snapshot.periodKey,
        ),
      recipients,
      summary,
    })
  }

  const {
    data:
      existingDelivery,
  } =
    await supabase
      .from(
        'report_deliveries',
      )
      .select(
        'id,status,sent_at',
      )
      .eq(
        'report_type',
        'monthly-sales',
      )
      .eq(
        'period_key',
        snapshot.periodKey,
      )
      .eq(
        'recipient_key',
        recipientKey,
      )
      .maybeSingle()

  if (
    existingDelivery
      ?.status ===
      'sent' &&
    !force
  ) {
    return response({
      status:
        'already-sent',
      periodKey:
        snapshot.periodKey,
      sentAt:
        existingDelivery.sent_at,
    })
  }

  let deliveryId:
    number | null =
      existingDelivery?.id ??
      null

  if (
    deliveryId ===
    null
  ) {
    const {
      data:
        insertedDelivery,
      error:
        insertError,
    } =
      await supabase
        .from(
          'report_deliveries',
        )
        .insert({
          report_type:
            'monthly-sales',
          period_key:
            snapshot.periodKey,
          recipient_key:
            recipientKey,
          status:
            'sending',
          sales_count:
            summary.salesCount,
          total_amount:
            summary.total,
        })
        .select('id')
        .single()

    if (
      insertError
    ) {
      console.error(
        'Error reservando envío mensual:',
        insertError,
      )

      return response(
        {
          error:
            'No fue posible reservar el envío mensual.',
        },
        500,
      )
    }

    deliveryId =
      insertedDelivery.id
  } else {
    await supabase
      .from(
        'report_deliveries',
      )
      .update({
        status:
          'sending',
        last_error:
          null,
        sales_count:
          summary.salesCount,
        total_amount:
          summary.total,
      })
      .eq(
        'id',
        deliveryId,
      )
  }

  const resendApiKey =
    requiredEnv(
      'RESEND_API_KEY',
    )

  const emailFrom =
    requiredEnv(
      'REPORT_EMAIL_FROM',
    )

  const reportLabel =
    monthLabel(
      snapshot.periodKey,
    )

  const csv =
    buildCsv(
      snapshot,
    )

  try {
    const resendResponse =
      await fetch(
        'https://api.resend.com/emails',
        {
          method:
            'POST',
          headers: {
            authorization:
              `Bearer ${resendApiKey}`,
            'content-type':
              'application/json',
          },
          body:
            JSON.stringify({
              from:
                emailFrom,
              to:
                recipients,
              subject:
                `C&S Repuestos · Reporte mensual · ${reportLabel}`,
              html:
                buildEmailHtml(
                  snapshot,
                ),
              attachments: [
                {
                  filename:
                    `cys-repuestos-ventas-${snapshot.periodKey}.csv`,
                  content:
                    utf8ToBase64(
                      csv,
                    ),
                },
              ],
            }),
        },
      )

    const resendBody =
      await resendResponse
        .json()
        .catch(
          () => ({}),
        )

    if (
      !resendResponse.ok
    ) {
      throw new Error(
        typeof resendBody
          ?.message ===
        'string'
          ? resendBody.message
          : `Resend respondió ${resendResponse.status}.`,
      )
    }

    await supabase
      .from(
        'report_deliveries',
      )
      .update({
        status:
          'sent',
        sent_at:
          new Date()
            .toISOString(),
        provider_message_id:
          typeof resendBody
            ?.id ===
          'string'
            ? resendBody.id
            : null,
        last_error:
          null,
      })
      .eq(
        'id',
        deliveryId,
      )

    return response({
      status:
        'sent',
      periodKey:
        snapshot.periodKey,
      recipients,
      salesCount:
        summary.salesCount,
      total:
        summary.total,
      providerMessageId:
        resendBody?.id ??
        null,
    })
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error desconocido enviando el reporte.'

    console.error(
      'Error enviando reporte mensual:',
      error,
    )

    await supabase
      .from(
        'report_deliveries',
      )
      .update({
        status:
          'failed',
        last_error:
          message.slice(
            0,
            1000,
          ),
      })
      .eq(
        'id',
        deliveryId,
      )

    return response(
      {
        error:
          'No fue posible enviar el reporte mensual.',
        detail:
          message,
      },
      502,
    )
  }
}

Deno.serve(main)
