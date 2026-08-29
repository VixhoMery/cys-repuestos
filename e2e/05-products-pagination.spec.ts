import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

function isProductsRpcResponse(
  response: import('@playwright/test').Response,
  expected: {
    search?: string | null
    category?: string | null
  },
) {
  const url =
    new URL(
      response.url(),
    )

  if (
    response.request().method() !==
      'POST' ||
    !url.pathname.endsWith(
      '/rest/v1/rpc/cys_list_products',
    ) ||
    response.status() !== 200
  ) {
    return false
  }

  try {
    const body =
      response.request()
        .postDataJSON() as {
          p_search?:
            | string
            | null
          p_category?:
            | string
            | null
        }

    if (
      'search' in expected &&
      body.p_search !==
        expected.search
    ) {
      return false
    }

    if (
      'category' in expected &&
      body.p_category !==
        expected.category
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

test.describe(
  'Paginación real de productos',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await login(page)

        await page.goto(
          '/productos',
        )

        await expect(
          page.getByText(
            /Mostrando 1–25 de \d+ productos/,
          ),
        ).toBeVisible()
      },
    )

    test(
      'avanza a la segunda página',
      async ({ page }) => {
        const next =
          page.getByRole(
            'button',
            {
              name:
                'Siguiente',
              exact: true,
            },
          )

        await expect(
          next,
        ).toBeEnabled()

        await next.click()

        await expect(
          page.getByText(
            /Página 2 de \d+/,
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            /Mostrando 26–50 de \d+ productos/,
          ),
        ).toBeVisible()

        await expect(
          page.getByRole(
            'button',
            {
              name:
                'Anterior',
              exact: true,
            },
          ),
        ).toBeEnabled()
      },
    )

    test(
      'búsqueda encuentra un producto aunque no esté en la página visible',
      async ({ page }) => {
        const responsePromise =
          page.waitForResponse(
            (response) =>
              isProductsRpcResponse(
                response,
                {
                  search:
                    'PAGTEST-MOT-001',
                },
              ),
          )

        await page
          .getByPlaceholder(
            'Buscar por nombre, marca o SKU...',
          )
          .fill(
            'PAGTEST-MOT-001',
          )

        const response =
          await responsePromise

        const body =
          await response.json()

        expect(
          body.pagination.total,
        ).toBeGreaterThanOrEqual(
          1,
        )

        expect(
          body.data.some(
            (product: {
              sku: string
            }) =>
              product.sku ===
              'PAGTEST-MOT-001',
          ),
        ).toBeTruthy()

        await expect(
          page.getByText(
            'Filtro de combustible',
            {
              exact: true,
            },
          ),
        ).toBeVisible()
      },
    )

    test(
      'categoría se filtra en PostgreSQL',
      async ({ page }) => {
        const responsePromise =
          page.waitForResponse(
            (response) =>
              isProductsRpcResponse(
                response,
                {
                  category:
                    'Motor',
                },
              ),
          )

        await page
          .getByRole(
            'button',
            {
              name:
                'Motor',
              exact: true,
            },
          )
          .click()

        const response =
          await responsePromise

        const body =
          await response.json()

        expect(
          body.data.length,
        ).toBeGreaterThan(
          0,
        )

        expect(
          body.data.every(
            (product: {
              category: string
            }) =>
              product.category ===
              'Motor',
          ),
        ).toBeTruthy()
      },
    )
  },
)
