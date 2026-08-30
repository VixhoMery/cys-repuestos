import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


type SupabaseConnection = {
  origin: string
  apiKey: string
  authorization: string
}


async function getSupabaseConnection(
  page: Page,
): Promise<SupabaseConnection> {
  const rpcRequestPromise =
    page.waitForRequest(
      (request) => {
        const url =
          new URL(
            request.url(),
          )

        return (
          request.method() ===
            'POST' &&
          url.pathname.endsWith(
            '/rest/v1/rpc/cys_list_products',
          )
        )
      },
    )

  await login(page)

  const rpcRequest =
    await rpcRequestPromise

  const url =
    new URL(
      rpcRequest.url(),
    )

  const headers =
    rpcRequest.headers()

  const apiKey =
    headers.apikey

  const authorization =
    headers.authorization

  expect(
    apiKey,
    'La petición Supabase debe incluir apikey.',
  ).toBeTruthy()

  expect(
    authorization,
    'La petición Supabase debe incluir la sesión autenticada.',
  ).toMatch(
    /^Bearer\s+/,
  )

  return {
    origin: url.origin,
    apiKey,
    authorization,
  }
}


function authHeaders(
  connection: SupabaseConnection,
) {
  return {
    apikey:
      connection.apiKey,
    authorization:
      connection.authorization,
    'Content-Type':
      'application/json',
  }
}


function anonHeaders(
  connection: SupabaseConnection,
) {
  return {
    apikey:
      connection.apiKey,
    'Content-Type':
      'application/json',
  }
}


async function rpc(
  request:
    APIRequestContext,
  connection:
    SupabaseConnection,
  functionName:
    string,
  body:
    Record<string, unknown>,
) {
  return request.post(
    `${connection.origin}/rest/v1/rpc/${functionName}`,
    {
      headers:
        authHeaders(
          connection,
        ),
      data:
        body,
    },
  )
}


function expectRejected(
  status: number,
) {
  expect(
    [400, 401, 403, 404],
  ).toContain(status)
}


test.describe(
  'Suite final de seguridad',
  () => {
    test(
      'usuario anónimo no puede ejecutar RPC del sistema',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const response =
          await request.post(
            `${connection.origin}/rest/v1/rpc/cys_list_products`,
            {
              headers:
                anonHeaders(
                  connection,
                ),
              data: {
                p_page: 1,
                p_limit: 1,
                p_search: null,
                p_category: null,
              },
            },
          )

        expect(
          response.ok(),
        ).toBe(false)

        expectRejected(
          response.status(),
        )
      },
    )


    test(
      'usuario autenticado no puede leer tablas comerciales directamente',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        for (
          const table of [
            'products',
            'sales',
            'sale_items',
            'report_deliveries',
          ]
        ) {
          const response =
            await request.get(
              `${connection.origin}/rest/v1/${table}?select=*&limit=1`,
              {
                headers:
                  authHeaders(
                    connection,
                  ),
              },
            )

          expect(
            response.ok(),
            `${table} no debe ser accesible directamente.`,
          ).toBe(false)

          expectRejected(
            response.status(),
          )
        }
      },
    )


    test(
      'usuario autenticado no puede ejecutar la RPC interna de activación',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const response =
          await rpc(
            request,
            connection,
            'cys_activate_owner_internal',
            {
              p_user_id:
                '00000000-0000-0000-0000-000000000000',
            },
          )

        expect(
          response.ok(),
        ).toBe(false)

        expectRejected(
          response.status(),
        )
      },
    )


    test(
      'RPC autorizada continúa funcionando para usuario válido',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const response =
          await rpc(
            request,
            connection,
            'cys_list_products',
            {
              p_page: 1,
              p_limit: 1,
              p_search: null,
              p_category: null,
            },
          )

        expect(
          response.status(),
        ).toBe(200)

        const body =
          await response.json() as {
            data?: unknown[]
            pagination?: {
              total?: number
            }
          }

        expect(
          Array.isArray(
            body.data,
          ),
        ).toBe(true)

        expect(
          typeof body.pagination
            ?.total,
        ).toBe('number')
      },
    )


    test(
      'constraint server-side rechaza URL externa no HTTP y hace rollback',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const categoryResponse =
          await rpc(
            request,
            connection,
            'cys_list_categories',
            {},
          )

        expect(
          categoryResponse.status(),
        ).toBe(200)

        const categories =
          await categoryResponse.json() as
            Array<{
              name: string
            }>

        test.skip(
          categories.length === 0,
          'La prueba necesita al menos una categoría existente.',
        )

        const sku =
          `SECURITY-URL-${Date.now()}`

        let productId:
          | number
          | null = null

        try {
          const createResponse =
            await rpc(
              request,
              connection,
              'cys_create_product',
              {
                p_name:
                  'Producto temporal seguridad',
                p_brand:
                  'Security Test',
                p_sku:
                  sku,
                p_category:
                  categories[0].name,
                p_supplier_id:
                  null,
                p_location:
                  null,
                p_net_price:
                  1000,
                p_price:
                  1500,
                p_stock:
                  0,
                p_short_description:
                  'Prueba temporal',
                p_description:
                  'Producto creado únicamente para una prueba de seguridad.',
              },
            )

          expect(
            createResponse.status(),
          ).toBe(200)

          const created =
            await createResponse.json() as {
              id: number
              images?: unknown[]
            }

          productId =
            created.id

          expect(
            created.images ?? [],
          ).toEqual([])

          const attackResponse =
            await rpc(
              request,
              connection,
              'cys_replace_product_images',
              {
                p_product_id:
                  productId,
                p_images: [
                  {
                    storagePath:
                      null,
                    externalUrl:
                      'javascript:alert(1)',
                    position:
                      1,
                  },
                ],
              },
            )

          expect(
            attackResponse.ok(),
          ).toBe(false)

          expectRejected(
            attackResponse.status(),
          )

          const afterResponse =
            await rpc(
              request,
              connection,
              'cys_get_product',
              {
                p_id:
                  productId,
              },
            )

          expect(
            afterResponse.status(),
          ).toBe(200)

          const after =
            await afterResponse.json() as {
              images?: unknown[]
            }

          expect(
            after.images ?? [],
          ).toEqual([])
        } finally {
          if (
            productId !== null
          ) {
            const cleanupResponse =
              await rpc(
                request,
                connection,
                'cys_delete_product',
                {
                  p_id:
                    productId,
                },
              )

            expect(
              cleanupResponse.status(),
            ).toBe(200)
          }
        }
      },
    )


    test(
      'constraint server-side rechaza nombre de producto demasiado largo',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const categoryResponse =
          await rpc(
            request,
            connection,
            'cys_list_categories',
            {},
          )

        expect(
          categoryResponse.status(),
        ).toBe(200)

        const categories =
          await categoryResponse.json() as
            Array<{
              name: string
            }>

        test.skip(
          categories.length === 0,
          'La prueba necesita al menos una categoría existente.',
        )

        const sku =
          `SECURITY-${Date.now()}`

        const createResponse =
          await rpc(
            request,
            connection,
            'cys_create_product',
            {
              p_name:
                'X'.repeat(
                  101,
                ),
              p_brand:
                'Security Test',
              p_sku:
                sku,
              p_category:
                categories[0].name,
              p_supplier_id:
                null,
              p_location:
                null,
              p_net_price:
                1000,
              p_price:
                1500,
              p_stock:
                0,
              p_short_description:
                'Prueba seguridad',
              p_description:
                'Este registro no debe llegar a crearse.',
            },
          )

        expect(
          createResponse.ok(),
        ).toBe(false)

        expectRejected(
          createResponse.status(),
        )

        const verifyResponse =
          await rpc(
            request,
            connection,
            'cys_list_products',
            {
              p_page: 1,
              p_limit: 25,
              p_search: sku,
              p_category: null,
            },
          )

        expect(
          verifyResponse.status(),
        ).toBe(200)

        const verifyBody =
          await verifyResponse.json() as {
            data?: unknown[]
            pagination?: {
              total?: number
            }
          }

        expect(
          verifyBody.pagination
            ?.total,
        ).toBe(0)

        expect(
          verifyBody.data,
        ).toEqual([])
      },
    )


    test(
      'cuotas inválidas se rechazan en PostgreSQL sin crear venta',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const response =
          await rpc(
            request,
            connection,
            'cys_create_sale',
            {
              p_items: [],
              p_payment_method:
                'credito',
              p_installments:
                37,
            },
          )

        expect(
          response.ok(),
        ).toBe(false)

        expectRejected(
          response.status(),
        )

        const text =
          (
            await response.text()
          ).toLowerCase()

        expect(
          text,
        ).toContain(
          'cuotas',
        )
      },
    )


    test(
      'Edge Functions sensibles rechazan solicitudes sin autenticación o secreto',
      async ({
        page,
        request,
      }) => {
        const connection =
          await getSupabaseConnection(
            page,
          )

        const registerResponse =
          await request.post(
            `${connection.origin}/functions/v1/register-owner`,
            {
              headers:
                anonHeaders(
                  connection,
                ),
              data: {
                code:
                  'codigo-que-no-se-usa',
              },
            },
          )

        expect(
          registerResponse.ok(),
        ).toBe(false)

        expect(
          [
            401,
            403,
          ],
        ).toContain(
          registerResponse.status(),
        )

        const reportResponse =
          await request.post(
            `${connection.origin}/functions/v1/monthly-sales-report`,
            {
              headers:
                anonHeaders(
                  connection,
                ),
              data: {
                dryRun:
                  true,
              },
            },
          )

        expect(
          reportResponse.status(),
        ).toBe(401)
      },
    )
  },
)
