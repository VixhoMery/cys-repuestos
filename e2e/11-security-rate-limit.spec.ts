import {
  expect,
  test,
} from '@playwright/test'


test.describe(
  'Rate limiting',
  () => {
    test(
      'API entrega headers de rate limit',
      async ({ request }) => {
        const response =
          await request.get(
            'http://localhost:3000/api/products?page=1&limit=1',
          )

        // Sin sesión sigue siendo 401.
        expect(
          response.status(),
        ).toBe(401)

        const headers =
          response.headers()

        // express-rate-limit con standardHeaders
        // agrega RateLimit.
        expect(
          headers[
            'ratelimit'
          ] ??
            headers[
              'ratelimit-policy'
            ],
        ).toBeTruthy()
      },
    )


    test(
      'health check no consume rate limit',
      async ({ request }) => {
        const response =
          await request.get(
            'http://localhost:3000/api/health',
          )

        expect(
          response.status(),
        ).toBe(200)

        const headers =
          response.headers()

        expect(
          headers[
            'ratelimit'
          ],
        ).toBeUndefined()

        expect(
          headers[
            'ratelimit-policy'
          ],
        ).toBeUndefined()
      },
    )
  },
)
