import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

test.describe(
  'Entradas y consultas Supabase',
  () => {
    test(
      'un intento de SQL injection en búsqueda se trata como texto',
      async ({ page }) => {
        await login(page)

        await page.goto(
          '/productos',
        )

        const payload =
          "%' OR 1=1 --"

        const responsePromise =
          page.waitForResponse(
            (response) => {
              const url =
                new URL(
                  response.url(),
                )

              if (
                response.request()
                  .method() !==
                  'POST' ||
                !url.pathname.endsWith(
                  '/rest/v1/rpc/cys_list_products',
                ) ||
                response.status() !==
                  200
              ) {
                return false
              }

              try {
                const requestBody =
                  response.request()
                    .postDataJSON() as {
                      p_search?:
                        | string
                        | null
                    }

                return (
                  requestBody.p_search ===
                  payload
                )
              } catch {
                return false
              }
            },
          )

        await page
          .getByPlaceholder(
            'Buscar por nombre, marca o SKU...',
          )
          .fill(payload)

        const response =
          await responsePromise

        const body =
          await response.json()

        // Si el payload se concatenara
        // inseguramente al SQL podría
        // devolver todo el catálogo.
        // La RPC debe tratarlo como texto.
        expect(
          body.pagination.total,
        ).toBe(0)

        expect(
          body.data,
        ).toEqual([])
      },
    )
  },
)
