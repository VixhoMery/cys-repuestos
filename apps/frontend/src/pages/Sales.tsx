import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Copy,
  Eye,
  Phone,
  Printer,
  ReceiptText,
  Search,
  UserRound,
  X,
} from 'lucide-react'

import {
  getPaymentDescription,
  getSales,
  saleToReceiptSale,
  type Sale,
} from '../api/sales'

import {
  printSaleReceipt,
} from '../lib/saleReceipt'


function Sales() {
  // ------------------------------------
  // Estados
  // ------------------------------------

  const [
    sales,
    setSales,
  ] =
    useState<Sale[]>([])

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState('')

  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<Sale | null>(
      null,
    )

  const [
    copiedPhone,
    setCopiedPhone,
  ] =
    useState(false)


  // ------------------------------------
  // Cargar ventas reales
  // ------------------------------------

  useEffect(() => {
    const loadSales =
      async () => {
        try {
          const data =
            await getSales()

          setSales(data)
        } catch (error) {
          console.error(
            'Error cargando ventas:',
            error,
          )
        }
      }

    loadSales()
  }, [])


  // ------------------------------------
  // Formatear dinero
  // ------------------------------------

  const formatCurrency = (
    amount: number,
  ) => {
    return `$${amount.toLocaleString(
      'es-CL',
    )}`
  }


  // ------------------------------------
  // Formatear fecha
  // ------------------------------------

  const formatDate = (
    date: string,
  ) => {
    return new Intl.DateTimeFormat(
      'es-CL',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(
      new Date(date),
    )
  }


  // ------------------------------------
  // Formatear hora
  // ------------------------------------

  const formatTime = (
    date: string,
  ) => {
    return new Intl.DateTimeFormat(
      'es-CL',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(
      new Date(date),
    )
  }


  // ------------------------------------
  // Copiar teléfono
  // ------------------------------------

  const copyCustomerPhone =
    async (
      phone: string,
    ) => {
      try {
        await navigator.clipboard.writeText(
          phone,
        )

        setCopiedPhone(
          true,
        )

        window.setTimeout(
          () => {
            setCopiedPhone(
              false,
            )
          },
          1600,
        )
      } catch (error) {
        console.error(
          'Error copiando teléfono:',
          error,
        )
      }
    }


  // ------------------------------------
  // Filtrar ventas
  // ------------------------------------

  const filteredSales =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        const phoneQuery =
          query.replace(
            /\D/g,
            '',
          )

        return sales.filter(
          (sale) => {
            const customerName =
              sale.customerName
                ?.toLowerCase() ??
              ''

            const customerPhone =
              sale.customerPhone
                ?.toLowerCase() ??
              ''

            const customerPhoneDigits =
              customerPhone.replace(
                /\D/g,
                '',
              )

            const matchesPhone =
              phoneQuery.length >
                0 &&
              customerPhoneDigits.includes(
                phoneQuery,
              )

            const matchesSearch =
              query === '' ||
              sale.seller
                .toLowerCase()
                .includes(
                  query,
                ) ||
              sale.id
                .toString()
                .includes(
                  query,
                ) ||
              customerName.includes(
                query,
              ) ||
              customerPhone.includes(
                query,
              ) ||
              matchesPhone ||
              sale.items.some(
                (item) =>
                  item.name
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              )

            const saleDate =
              sale.soldAt.slice(
                0,
                10,
              )

            const matchesDate =
              selectedDate ===
                '' ||
              saleDate ===
                selectedDate

            return (
              matchesSearch &&
              matchesDate
            )
          },
        )
      },
      [
        sales,
        search,
        selectedDate,
      ],
    )


  // ------------------------------------
  // Total del resultado filtrado
  // ------------------------------------

  const filteredTotal =
    filteredSales.reduce(
      (
        accumulator,
        sale,
      ) =>
        accumulator +
        sale.total,
      0,
    )


  return (
    <section>
      {/* Encabezado */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Ventas
        </h1>

        <p className="mt-1 text-slate-500">
          Revisa las ventas
          registradas en el
          sistema.
        </p>
      </header>


      {/* Resumen */}
      <div
        className="
          mb-6 grid gap-4
          sm:grid-cols-2
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >
              <ReceiptText
                size={22}
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Ventas
                encontradas
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {
                  filteredSales.length
                }
              </p>
            </div>
          </div>
        </div>


        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <p className="text-sm text-slate-500">
            Total vendido
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(
              filteredTotal,
            )}
          </p>
        </div>
      </div>


      {/* Buscador y filtros */}
      <div
        className="
          mb-6
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
        "
      >
        <div
          className="
            flex flex-col
            gap-4
            lg:flex-row
          "
        >
          {/* Buscar */}
          <div className="relative flex-1">
            <Search
              size={19}
              className="
                absolute
                left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Buscar por vendedor, producto, comprador, teléfono o número de venta..."
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                py-3 pl-11 pr-4
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>


          {/* Fecha */}
          <div className="relative">
            <CalendarDays
              size={19}
              className="
                pointer-events-none
                absolute
                left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="date"
              value={
                selectedDate
              }
              onChange={(
                event,
              ) =>
                setSelectedDate(
                  event.target
                    .value,
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                py-3 pl-11 pr-4
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                lg:w-52
              "
            />
          </div>


          {/* Limpiar filtros */}
          {(
            search ||
            selectedDate
          ) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedDate(
                  '',
                )
              }}
              className="
                rounded-xl
                border
                border-slate-200
                px-5 py-3
                font-medium
                text-slate-600
                transition
                hover:bg-slate-50
              "
            >
              Limpiar
            </button>
          )}
        </div>
      </div>


      {/* Tabla */}
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr
                className="
                  border-b
                  border-slate-200
                  text-left
                  text-sm
                  text-slate-500
                "
              >
                <th className="px-6 py-4 font-medium">
                  Venta
                </th>

                <th className="px-6 py-4 font-medium">
                  Fecha y hora
                </th>

                <th className="px-6 py-4 font-medium">
                  Vendedor
                </th>

                <th className="px-6 py-4 font-medium">
                  Productos
                </th>

                <th className="px-6 py-4 font-medium">
                  Total
                </th>

                <th className="px-6 py-4 font-medium">
                  Detalle
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.length >
              0 ? (
                filteredSales.map(
                  (sale) => {
                    const units =
                      sale.items.reduce(
                        (
                          accumulator,
                          item,
                        ) =>
                          accumulator +
                          item.quantity,
                        0,
                      )

                    const hasTemporaryItem =
                      sale.items.some(
                        (item) =>
                          item.itemType ===
                          'temporary',
                      )

                    return (
                      <tr
                        key={
                          sale.id
                        }
                        className="
                          border-b
                          border-slate-100
                          last:border-b-0
                          hover:bg-slate-50/70
                        "
                      >
                        <td className="px-6 py-5">
                          <span className="font-semibold text-slate-900">
                            #
                            {
                              sale.id
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-800">
                            {formatDate(
                              sale.soldAt,
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatTime(
                              sale.soldAt,
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <UserRound
                              size={
                                17
                              }
                              className="text-slate-400"
                            />

                            <span className="text-slate-700">
                              {
                                sale.seller
                              }
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-700">
                              {
                                units
                              }{' '}
                              {units ===
                              1
                                ? 'producto'
                                : 'productos'}
                            </p>

                            {hasTemporaryItem && (
                              <span
                                className="
                                  rounded-full
                                  bg-amber-50
                                  px-2 py-0.5
                                  text-xs
                                  font-medium
                                  text-amber-700
                                "
                              >
                                Temporal
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              sale.items
                                .length
                            }{' '}
                            {sale.items
                              .length ===
                            1
                              ? 'tipo'
                              : 'tipos'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(
                              sale.total,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => {
                              setCopiedPhone(
                                false,
                              )

                              setSelectedSale(
                                sale,
                              )
                            }}
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              px-3 py-2
                              text-sm
                              font-medium
                              text-blue-600
                              transition
                              hover:bg-blue-50
                            "
                          >
                            <Eye
                              size={
                                17
                              }
                            />

                            Ver
                          </button>
                        </td>
                      </tr>
                    )
                  },
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      px-6 py-16
                      text-center
                      text-slate-500
                    "
                  >
                    No se
                    encontraron
                    ventas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ==================================
          MODAL DETALLE DE VENTA
      ================================== */}

      {selectedSale && (
        <div
          className="
            fixed inset-0
            z-50
            flex items-center
            justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full max-w-lg
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-xl
            "
          >
            {/* Cabecera */}
            <div
              className="
                flex items-start
                justify-between
                border-b
                border-slate-200
                p-6
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-medium
                    text-blue-600
                  "
                >
                  Venta #
                  {
                    selectedSale.id
                  }
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Detalle de
                  venta
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCopiedPhone(
                    false,
                  )

                  setSelectedSale(
                    null,
                  )
                }}
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
              >
                <X
                  size={20}
                />
              </button>
            </div>


            {/* Información */}
            <div
              className="
                grid grid-cols-2
                gap-4
                border-b
                border-slate-200
                bg-slate-50
                px-6 py-5
              "
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Vendedor
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {
                    selectedSale.seller
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Fecha
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {formatDate(
                    selectedSale.soldAt,
                  )}{' '}
                  ·{' '}
                  {formatTime(
                    selectedSale.soldAt,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Método de pago
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {getPaymentDescription(
                    selectedSale.paymentMethod,
                    selectedSale.installments,
                  )}
                </p>
              </div>
            </div>


            {/* Datos del comprador */}
            {(
              selectedSale.customerName ||
              selectedSale.customerPhone
            ) && (
              <div
                className="
                  border-b
                  border-slate-200
                  bg-blue-50/60
                  px-6 py-5
                "
              >
                <div className="flex items-center gap-2">
                  <UserRound
                    size={18}
                    className="text-blue-600"
                  />

                  <h3 className="font-semibold text-slate-900">
                    Datos del
                    comprador
                  </h3>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Nombre
                    </p>

                    <p className="mt-1 font-medium text-slate-800">
                      {selectedSale.customerName ??
                        'No registrado'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Teléfono
                    </p>

                    {selectedSale.customerPhone ? (
                      <div className="mt-1 flex items-center gap-2">
                        <Phone
                          size={
                            16
                          }
                          className="shrink-0 text-slate-400"
                        />

                        <a
                          href={`tel:${selectedSale.customerPhone}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {
                            selectedSale.customerPhone
                          }
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            copyCustomerPhone(
                              selectedSale.customerPhone!,
                            )
                          }
                          title="Copiar teléfono"
                          className="
                            rounded-md
                            p-1.5
                            text-slate-400
                            transition
                            hover:bg-white
                            hover:text-blue-600
                          "
                        >
                          <Copy
                            size={
                              15
                            }
                          />
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 font-medium text-slate-800">
                        No
                        registrado
                      </p>
                    )}

                    {copiedPhone && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        Teléfono
                        copiado
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Productos */}
            <div
              className="
                max-h-72
                overflow-y-auto
                px-6
              "
            >
              {selectedSale.items.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.productId ?? 'temporary'}-${item.name}-${index}`}
                    className="
                      flex
                      justify-between
                      gap-4
                      border-b
                      border-slate-100
                      py-4
                      last:border-b-0
                    "
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {
                            item.name
                          }
                        </p>

                        {item.itemType ===
                          'temporary' && (
                          <span
                            className="
                              rounded-full
                              bg-amber-50
                              px-2 py-0.5
                              text-xs
                              font-medium
                              text-amber-700
                            "
                          >
                            Temporal
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          item.quantity
                        }{' '}
                        ×{' '}
                        {formatCurrency(
                          item.unitPrice,
                        )}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-900">
                      {formatCurrency(
                        item.unitPrice *
                          item.quantity,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>


            {/* Total */}
            <div
              className="
                border-t
                border-slate-200
                bg-slate-50
                p-6
              "
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Total venta
                </span>

                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    selectedSale.total,
                  )}
                </span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      printSaleReceipt(
                        saleToReceiptSale(
                          selectedSale,
                        ),
                      )
                    } catch (
                      error
                    ) {
                      console.error(
                        'Error imprimiendo comprobante:',
                        error,
                      )

                      window.alert(
                        'No fue posible abrir la impresión. Revisa si el navegador bloqueó la ventana emergente.',
                      )
                    }
                  }}
                  className="
                    flex flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-4 py-3
                    font-medium
                    text-white
                    transition
                    hover:bg-blue-700
                  "
                >
                  <Printer
                    size={18}
                  />

                  Imprimir
                  comprobante
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCopiedPhone(
                      false,
                    )

                    setSelectedSale(
                      null,
                    )
                  }}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-4 py-3
                    font-medium
                    text-slate-700
                    transition
                    hover:bg-slate-100
                  "
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Sales
