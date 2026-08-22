import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BadgeDollarSign,
  PackageCheck,
  ReceiptText,
  ShoppingBasket,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getSales,
  type Sale,
} from '../api/sales'


// ------------------------------------
// Tipos
// ------------------------------------

type Period =
  | 'day'
  | 'week'
  | 'month'
  | 'year'


type ChartPoint = {
  label: string
  total: number
}


// ------------------------------------
// Helpers de fecha
// ------------------------------------

function startOfDay(date: Date) {
  const result = new Date(date)

  result.setHours(0, 0, 0, 0)

  return result
}


function startOfWeek(date: Date) {
  const result = startOfDay(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day

  result.setDate(result.getDate() + diff)

  return result
}


function addDays(
  date: Date,
  days: number,
) {
  const result = new Date(date)

  result.setDate(result.getDate() + days)

  return result
}


function Statistics() {
  const [period, setPeriod] =
    useState<Period>('week')

  const [sales, setSales] =
    useState<Sale[]>([])


  // ------------------------------------
  // Cargar ventas reales
  // ------------------------------------

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await getSales()
        setSales(data)
      } catch (error) {
        console.error(
          'Error cargando estadísticas:',
          error,
        )
      }
    }

    loadSales()
  }, [])


  // ------------------------------------
  // Ventas del período seleccionado
  // ------------------------------------

  const filteredSales = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = addDays(today, 1)
    const weekStart = startOfWeek(now)
    const weekEnd = addDays(weekStart, 7)

    return sales.filter((sale) => {
      const soldAt = new Date(sale.soldAt)

      if (period === 'day') {
        return (
          soldAt >= today &&
          soldAt < tomorrow
        )
      }

      if (period === 'week') {
        return (
          soldAt >= weekStart &&
          soldAt < weekEnd
        )
      }

      if (period === 'month') {
        return (
          soldAt.getFullYear() ===
            now.getFullYear() &&
          soldAt.getMonth() ===
            now.getMonth()
        )
      }

      return (
        soldAt.getFullYear() ===
        now.getFullYear()
      )
    })
  }, [sales, period])


  // ------------------------------------
  // Datos del gráfico principal
  // ------------------------------------

  const currentData = useMemo<ChartPoint[]>(() => {
    if (period === 'day') {
      const buckets = [
        { label: '00:00', start: 0 },
        { label: '04:00', start: 4 },
        { label: '08:00', start: 8 },
        { label: '12:00', start: 12 },
        { label: '16:00', start: 16 },
        { label: '20:00', start: 20 },
      ]

      return buckets.map((bucket) => ({
        label: bucket.label,
        total: filteredSales
          .filter((sale) => {
            const hour =
              new Date(sale.soldAt).getHours()

            return (
              hour >= bucket.start &&
              hour < bucket.start + 4
            )
          })
          .reduce(
            (sum, sale) =>
              sum + sale.total,
            0,
          ),
      }))
    }

    if (period === 'week') {
      const weekStart =
        startOfWeek(new Date())

      const labels = [
        'Lun',
        'Mar',
        'Mié',
        'Jue',
        'Vie',
        'Sáb',
        'Dom',
      ]

      return labels.map(
        (label, index) => {
          const dayStart =
            addDays(weekStart, index)
          const dayEnd =
            addDays(dayStart, 1)

          return {
            label,
            total: filteredSales
              .filter((sale) => {
                const soldAt =
                  new Date(sale.soldAt)

                return (
                  soldAt >= dayStart &&
                  soldAt < dayEnd
                )
              })
              .reduce(
                (sum, sale) =>
                  sum + sale.total,
                0,
              ),
          }
        },
      )
    }

    if (period === 'month') {
      return [1, 2, 3, 4, 5].map(
        (week) => ({
          label: `Sem ${week}`,
          total: filteredSales
            .filter((sale) => {
              const day =
                new Date(
                  sale.soldAt,
                ).getDate()

              return (
                Math.floor(
                  (day - 1) / 7,
                ) + 1 === week
              )
            })
            .reduce(
              (sum, sale) =>
                sum + sale.total,
              0,
            ),
        }),
      )
    }

    const monthLabels = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ]

    return monthLabels.map(
      (label, month) => ({
        label,
        total: filteredSales
          .filter(
            (sale) =>
              new Date(
                sale.soldAt,
              ).getMonth() === month,
          )
          .reduce(
            (sum, sale) =>
              sum + sale.total,
            0,
          ),
      }),
    )
  }, [filteredSales, period])


  // ------------------------------------
  // Tarjetas resumen
  // ------------------------------------

  const totalSold =
    filteredSales.reduce(
      (sum, sale) =>
        sum + sale.total,
      0,
    )

  const totalSales =
    filteredSales.length

  const unitsSold =
    filteredSales.reduce(
      (saleTotal, sale) =>
        saleTotal +
        sale.items.reduce(
          (itemTotal, item) =>
            itemTotal + item.quantity,
          0,
        ),
      0,
    )

  const averageSale =
    totalSales > 0
      ? Math.round(
          totalSold / totalSales,
        )
      : 0


  // ------------------------------------
  // Productos más vendidos
  // ------------------------------------

  const topProducts = useMemo(() => {
    const products =
      new Map<string, number>()

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        products.set(
          item.name,
          (products.get(item.name) ?? 0) +
            item.quantity,
        )
      })
    })

    return Array.from(
      products.entries(),
    )
      .map(([name, units]) => ({
        name,
        units,
      }))
      .sort(
        (a, b) =>
          b.units - a.units,
      )
      .slice(0, 4)
  }, [filteredSales])


  // ------------------------------------
  // Ventas por vendedor
  // ------------------------------------

  const sellerStats = useMemo(() => {
    const sellers = new Map<
      string,
      {
        name: string
        sales: number
        units: number
        total: number
      }
    >()

    filteredSales.forEach((sale) => {
      const current =
        sellers.get(sale.seller) ?? {
          name: sale.seller,
          sales: 0,
          units: 0,
          total: 0,
        }

      current.sales += 1
      current.total += sale.total
      current.units +=
        sale.items.reduce(
          (sum, item) =>
            sum + item.quantity,
          0,
        )

      sellers.set(
        sale.seller,
        current,
      )
    })

    return Array.from(
      sellers.values(),
    ).sort(
      (a, b) =>
        b.total - a.total,
    )
  }, [filteredSales])


  // ------------------------------------
  // Formatear CLP
  // ------------------------------------

  const formatCurrency = (
    amount: number,
  ) => {
    return `$${amount.toLocaleString(
      'es-CL',
    )}`
  }


  // ------------------------------------
  // Nombre del período
  // ------------------------------------

  const periodLabel = {
    day: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
    year: 'Este año',
  }[period]

  return (
    <section>
      {/* Encabezado */}
      <header
        className="
          mb-8 flex flex-col
          justify-between gap-4
          lg:flex-row
          lg:items-end
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Estadísticas
          </h1>

          <p className="mt-1 text-slate-500">
            Analiza las ventas registradas
            en el sistema.
          </p>
        </div>


        {/* Selector período */}
        <div
          className="
            flex w-fit rounded-xl
            border border-slate-200
            bg-white p-1
            shadow-sm
          "
        >
          {[
            {
              value: 'day',
              label: 'Día',
            },
            {
              value: 'week',
              label: 'Semana',
            },
            {
              value: 'month',
              label: 'Mes',
            },
            {
              value: 'year',
              label: 'Año',
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setPeriod(
                  option.value as Period,
                )
              }
              className={`
                rounded-lg
                px-4 py-2
                text-sm
                font-medium
                transition

                ${
                  period ===
                  option.value
                    ? `
                      bg-blue-600
                      text-white
                    `
                    : `
                      text-slate-500
                      hover:bg-slate-100
                      hover:text-slate-800
                    `
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>


      {/* --------------------------------
          TARJETAS RESUMEN
      -------------------------------- */}

      <div
        className="
          mb-8 grid gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {/* Dinero vendido */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total vendido
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  totalSold,
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {periodLabel}
              </p>
            </div>

            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-green-50
                text-green-600
              "
            >
              <BadgeDollarSign
                size={22}
              />
            </div>
          </div>
        </div>


        {/* Número de ventas */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Ventas registradas
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalSales}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {periodLabel}
              </p>
            </div>

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
              <ReceiptText size={22} />
            </div>
          </div>
        </div>


        {/* Unidades */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Productos vendidos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {unitsSold}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Unidades
              </p>
            </div>

            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600
              "
            >
              <PackageCheck size={22} />
            </div>
          </div>
        </div>


        {/* Promedio */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Venta promedio
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  averageSale,
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Por venta
              </p>
            </div>

            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
              "
            >
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      </div>


      {/* --------------------------------
          GRÁFICO DE VENTAS
      -------------------------------- */}

      <div
        className="
          mb-8
          rounded-2xl
          border border-slate-200
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Evolución de ventas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Dinero registrado durante el
            período seleccionado.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={currentData}
              margin={{
                top: 10,
                right: 20,
                left: 20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(
                  value,
                ) =>
                  `$${(
                    value / 1000
                  ).toLocaleString(
                    'es-CL',
                  )}k`
                }
              />

              <Tooltip
                formatter={(value) => [
                  formatCurrency(
                    Number(value),
                  ),
                  'Ventas',
                ]}
              />

              <Line
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* --------------------------------
          PRODUCTOS + VENDEDORES
      -------------------------------- */}

      <div
        className="
          grid gap-8
          xl:grid-cols-2
        "
      >
        {/* Productos más vendidos */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >
              <ShoppingBasket
                size={20}
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Productos más vendidos
              </h2>

              <p className="text-sm text-slate-500">
                Unidades registradas
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{
                  left: 15,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={145}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(
                    value,
                  ) => [
                    `${value} unidades`,
                    'Vendidos',
                  ]}
                />

                <Bar
                  dataKey="units"
                  fill="#2563eb"
                  radius={[
                    0,
                    6,
                    6,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Ventas por vendedor */}
        <div
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600
              "
            >
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Ventas por vendedor
              </h2>

              <p className="text-sm text-slate-500">
                Rendimiento registrado
              </p>
            </div>
          </div>


          <div className="space-y-3">
            {sellerStats.map(
              (seller) => (
                <div
                  key={seller.name}
                  className="
                    rounded-xl
                    border
                    border-slate-100
                    bg-slate-50
                    p-4
                  "
                >
                  <div
                    className="
                      flex items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {seller.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {seller.sales}{' '}
                        ventas ·{' '}
                        {seller.units}{' '}
                        unidades
                      </p>
                    </div>

                    <p className="font-bold text-slate-900">
                      {formatCurrency(
                        seller.total,
                      )}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Statistics