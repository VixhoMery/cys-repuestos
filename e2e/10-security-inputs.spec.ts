import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test.describe(
  'Entradas y errores',
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

              return (
                url.pathname.endsWith(
                  '/api/products',
                ) &&
                url.searchParams.get(
                  'search',
                ) ===
                  payload
              )
            },
          )

        await page
          .getByPlaceholder(
            'Buscar por nombre, marca o SKU...',
          )
          .fill(payload)

        const response =
          await responsePromise

        expect(
          response.status(),
        ).toBe(200)

        const body =
          await response.json()

        // Si el payload se concatenara al SQL,
        // podría devolver todo el catálogo.
        // Parametrizado correctamente, se busca
        // literalmente y no debe devolver filas.
        expect(
          body.pagination.total,
        ).toBe(0)

        expect(
          body.data,
        ).toEqual([])
      },
    )


    test(
      'ruta inexistente responde JSON 404 sin stack trace',
      async ({ request }) => {
        const response =
          await request.get(
            'http://localhost:3000/api/ruta-que-no-existe',
          )

        expect(
          response.status(),
        ).toBe(404)

        expect(
          response.headers()[
            'content-type'
          ],
        ).toContain(
          'application/json',
        )

        const body =
          await response.json()

        expect(body).toEqual({
          message:
            'Ruta no encontrada.',
        })
      },
    )


    test(
      'JSON demasiado grande se rechaza con 413 limpio',
      async ({ request }) => {
        const hugeText =
          'A'.repeat(
            60 * 1024,
          )

        const response =
          await request.post(
            'http://localhost:3000/api/products',
            {
              headers: {
                'Content-Type':
                  'application/json',
              },
              data: {
                payload:
                  hugeText,
              },
            },
          )

        // El parser JSON se ejecuta antes
        // de requireAuth y debe detener el
        // cuerpo excesivo.
        expect(
          response.status(),
        ).toBe(413)

        const body =
          await response.json()

        expect(body).toEqual({
          message:
            'La solicitud es demasiado grande.',
        })
      },
    )
  },
)
