import {
  expect,
  test,
} from '@playwright/test'


const apiBaseUrl =
  'http://localhost:3000/api'


test.describe(
  'Seguridad API sin autenticación',
  () => {
    test(
      'productos no permite lectura sin token',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/products?page=1&limit=1`,
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'producto individual no permite lectura sin token',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/products/1`,
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'productos no permite creación sin token',
      async ({ request }) => {
        const response =
          await request.post(
            `${apiBaseUrl}/products`,
            {
              data: {
                name:
                  'ATAQUE TEST',
                brand:
                  'TEST',
                sku:
                  'SECURITY-TEST',
                category:
                  'Motor',
                netPrice:
                  1000,
                price:
                  1500,
                shortDescription:
                  'No debe crearse',
                description:
                  'Petición sin autenticación que debe ser rechazada.',
              },
            },
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'productos no permite edición sin token',
      async ({ request }) => {
        const response =
          await request.patch(
            `${apiBaseUrl}/products/1`,
            {
              data: {
                name:
                  'ATAQUE TEST',
              },
            },
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'productos no permite modificar imágenes sin token',
      async ({ request }) => {
        const response =
          await request.put(
            `${apiBaseUrl}/products/1/images`,
            {
              data: {
                images: [],
              },
            },
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'productos no permite eliminación sin token',
      async ({ request }) => {
        const response =
          await request.delete(
            `${apiBaseUrl}/products/999999999`,
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'categorías sigue protegida sin token',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/products/categories`,
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )


    test(
      'ventas sigue protegida sin token',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/sales`,
          )

        expect(
          response.status(),
        ).toBe(401)
      },
    )
  },
)
