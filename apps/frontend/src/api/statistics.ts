import { supabase } from '../lib/supabase'

export type InventoryValuation = {
  productCount: number
  totalUnits: number
  netInventoryValue: number
  inventoryVatValue: number
  inventoryCostWithTax: number
  averageUnitCostWithTax: number
  potentialSalesValue: number
  potentialSalesNetValue: number
  potentialSalesVatValue: number
  potentialProfit: number
}

const EMPTY_INVENTORY_VALUATION: InventoryValuation = {
  productCount: 0,
  totalUnits: 0,
  netInventoryValue: 0,
  inventoryVatValue: 0,
  inventoryCostWithTax: 0,
  averageUnitCostWithTax: 0,
  potentialSalesValue: 0,
  potentialSalesNetValue: 0,
  potentialSalesVatValue: 0,
  potentialProfit: 0,
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue)
    ? numberValue
    : 0
}

function normalizeInventoryValuation(
  value: unknown,
): InventoryValuation {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return {
      ...EMPTY_INVENTORY_VALUATION,
    }
  }

  const data =
    value as Record<
      string,
      unknown
    >

  return {
    productCount:
      toFiniteNumber(
        data.productCount,
      ),
    totalUnits:
      toFiniteNumber(
        data.totalUnits,
      ),
    netInventoryValue:
      toFiniteNumber(
        data.netInventoryValue,
      ),
    inventoryVatValue:
      toFiniteNumber(
        data.inventoryVatValue,
      ),
    inventoryCostWithTax:
      toFiniteNumber(
        data.inventoryCostWithTax,
      ),
    averageUnitCostWithTax:
      toFiniteNumber(
        data.averageUnitCostWithTax,
      ),
    potentialSalesValue:
      toFiniteNumber(
        data.potentialSalesValue,
      ),
    potentialSalesNetValue:
      toFiniteNumber(
        data.potentialSalesNetValue,
      ),
    potentialSalesVatValue:
      toFiniteNumber(
        data.potentialSalesVatValue,
      ),
    potentialProfit:
      toFiniteNumber(
        data.potentialProfit,
      ),
  }
}

export async function
getInventoryValuation() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_inventory_valuation',
    )

  if (error) {
    console.error(
      'Error Supabase (cargar valorización de inventario):',
      error,
    )

    throw new Error(
      error.message ||
        'No fue posible cargar la valorización del inventario.',
    )
  }

  return normalizeInventoryValuation(
    data,
  )
}
