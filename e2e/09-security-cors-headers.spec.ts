import {
  expect,
  test,
} from '@playwright/test'


const apiBaseUrl =
  'http://localhost:3000/api'


test.describe(
  'CORS y cabeceras HTTP',
  () => {
    test(
      'origen permitido recibe CORS',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/health`,
            {
              headers: {
                Origin:
                  'http://localhost:5173',
              },
            },
          )

        expect(
          response.status(),
        ).toBe(200)

        expect(
          response.headers()[
            'access-control-allow-origin'
          ],
        ).toBe(
          'http://localhost:5173',
        )
      },
    )


    test(
      'origen malicioso recibe 403 sin CORS',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/health`,
            {
              headers: {
                Origin:
                  'https://sitio-malicioso-ejemplo.com',
              },
            },
          )

        expect(
          response.status(),
        ).toBe(403)

        expect(
          response.headers()[
            'access-control-allow-origin'
          ],
        ).toBeUndefined()

        const body =
          await response.json()

        expect(body).toEqual({
          message:
            'Origen no permitido.',
        })
      },
    )


    test(
      'Express no expone X-Powered-By',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/health`,
          )

        expect(
          response.headers()[
            'x-powered-by'
          ],
        ).toBeUndefined()
      },
    )


    test(
      'Helmet agrega cabecera anti MIME sniffing',
      async ({ request }) => {
        const response =
          await request.get(
            `${apiBaseUrl}/health`,
          )

        expect(
          response.headers()[
            'x-content-type-options'
          ],
        ).toBe(
          'nosniff',
        )
      },
    )
  },
)
