import { useState } from 'react'
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


// ------------------------------------
// Tipos
// ------------------------------------

type Period =
  | 'day'
  | 'week'
  | 'month'
  | 'year'


// ------------------------------------
// Datos mock
// Después vendrán desde PostgreSQL
// ------------------------------------

const salesByPeriod = {
  day: [
    { label: '09:00', total: 85000 },
    { label: '11:00', total: 144000 },
    { label: '13:00', total: 92000 },
    { label: '15:00', total: 198000 },
    { label: '17:00', total: 156000 },
    { label: '19:00', total: 224000 },
  ],

  week: [
    { label: 'Lun', total: 428000 },
    { label: 'Mar', total: 512000 },
    { label: 'Mié', total: 384000 },
    { label: 'Jue', total: 625000 },
    { label: 'Vie', total: 743000 },
    { label: 'Sáb', total: 318000 },
  ],

  month: [
    { label: 'Sem 1', total: 1850000 },
    { label: 'Sem 2', total: 2140000 },
    { label: 'Sem 3', total: 1920000 },
    { label: 'Sem 4', total: 2470000 },
  ],

  year: [
    { label: 'Ene', total: 5400000 },
    { label: 'Feb', total: 5900000 },
    { label: 'Mar', total: 6200000 },
    { label: 'Abr', total: 5800000 },
    { label: 'May', total: 6900000 },
    { label: 'Jun', total: 7100000 },
    { label: 'Jul', total: 7450000 },
    { label: 'Ago', total: 6820000 },
  ],
}


const topProducts = [
  {
    name: 'Filtro de aceite',
    units: 42,
  },
  {
    name: 'Pastillas de freno',
    units: 31,
  },
  {
    name: 'Neumático 195/65 R15',
    units: 24,
  },
  {
    name: 'Alternador Toyota Yaris',
    units: 18,
  },
]


const sellerStats = [
  {
    name: 'Vicente',
    sales: 24,
    units: 46,
    total: 1845000,
  },
  {
    name: 'Camila',
    sales: 19,
    units: 37,
    total: 1428000,
  },
  {
    name: 'Daniel',
    sales: 15,
    units: 29,
    total: 1105000,
  },
]


// ------------------------------------
// Estadísticas
// ------------------------------------

function Statistics() {
  const [period, setPeriod] =
    useState<Period>('week')

  const currentData =
    salesByPeriod[period]


  // ------------------------------------
  // Resumen temporal
  // ------------------------------------

  const totalSold =
    currentData.reduce(
      (accumulator, item) =>
        accumulator + item.total,
      0,
    )

  // Estos valores son mock por ahora.
  // Luego se calcularán desde las ventas.
  const totalSales = 58
  const unitsSold = 112

  const averageSale =
    totalSales > 0
      ? Math.round(
          totalSold / totalSales,
        )
      : 0


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