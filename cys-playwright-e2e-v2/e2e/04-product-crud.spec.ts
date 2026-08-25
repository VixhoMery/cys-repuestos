import {
  expect,
  test,
  type Page,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

import {
  inputByLabel,
  selectByLabel,
  textareaByLabel,
} from './helpers/product-form'


async function findProductCard(
  page: Page,
  name: string,
) {
  const search =
    page.getByPlaceholder(
      'Buscar por nombre, marca o SKU...',
    )

  await search.fill(name)

  const card =
    page
      .locator('article')
      .filter({
        hasText: name,
      })
      .first()

  await expect(
    card,
  ).toBeVisible()

  return card
}


test(
  'CRUD completo de producto temporal',
  async ({ page }) => {
    await login(page)

    const stamp =
      Date.now()

    const productName =
      `E2E Producto ${stamp}`

    const sku =
      `E2E-${stamp}`

    let created = false

    try {
      // -----------------------
      // CREATE
      // -----------------------

      await page.goto(
        '/productos/nuevo',
      )

      await expect(
        selectByLabel(
          page,
          'Categoría',
        ),
      ).toBeEnabled()

      await inputByLabel(
        page,
        'Nombre del producto',
      ).fill(
        productName,
      )

      await inputByLabel(
        page,
        'Marca',
      ).fill(
        'Playwright',
      )

      await inputByLabel(
        page,
        'SKU',
      ).fill(
        sku,
      )

      await selectByLabel(
        page,
        'Categoría',
      ).selectOption(
        {
          label: 'Motor',
        },
      )

      await inputByLabel(
        page,
        'Valor neto',
      ).fill(
        '100000',
      )

      await expect(
        inputByLabel(
          page,
          'Valor con IVA',
        ),
      ).toHaveValue(
        '119000',
      )

      await inputByLabel(
        page,
        'Valor de venta',
      ).fill(
        '149990',
      )

      await textareaByLabel(
        page,
        'Descripción corta',
      ).fill(
        'Producto temporal de prueba E2E',
      )

      await textareaByLabel(
        page,
        'Descripción completa',
      ).fill(
        'Producto creado automáticamente para probar el CRUD y eliminado al finalizar.',
      )

      await page
        .getByRole(
          'button',
          {
            name:
              'Agregar producto',
            exact: true,
          },
        )
        .click()

      await expect(
        page,
      ).toHaveURL(
        /\/productos$/,
      )

      created = true


      // -----------------------
      // READ
      // -----------------------

      let card =
        await findProductCard(
          page,
          productName,
        )

      await card.click()

      await expect(
        page.getByRole(
          'heading',
          {
            name:
              productName,
            exact: true,
          },
        ),
      ).toBeVisible()

      await expect(
        page.getByText(
          '$149.990',
          {
            exact: true,
          },
        ),
      ).toBeVisible()


      // -----------------------
      // UPDATE
      // -----------------------

      await page
        .getByRole(
          'button',
          {
            name:
              /editar producto/i,
          },
        )
        .click()

      await inputByLabel(
        page,
        'Valor neto',
      ).fill(
        '110000',
      )

      await expect(
        inputByLabel(
          page,
          'Valor con IVA',
        ),
      ).toHaveValue(
        '130900',
      )

      await inputByLabel(
        page,
        'Valor de venta',
      ).fill(
        '159990',
      )

      await inputByLabel(
        page,
        'Stock',
      ).fill(
        '5',
      )

      await page
        .getByRole(
          'button',
          {
            name:
              /guardar cambios/i,
          },
        )
        .click()

      await expect(
        page,
      ).toHaveURL(
        /\/productos\/\d+$/,
      )

      await expect(
        page.getByText(
          '$159.990',
          {
            exact: true,
          },
        ),
      ).toBeVisible()

      await expect(
        page.getByText(
          'Stock: 5',
          {
            exact: true,
          },
        ),
      ).toBeVisible()


      // -----------------------
      // DELETE
      // -----------------------

      await page.goto(
        '/productos',
      )

      card =
        await findProductCard(
          page,
          productName,
        )

      await card
        .getByRole(
          'button',
          {
            name:
              /opciones del producto/i,
          },
        )
        .click()

      await card
        .getByRole(
          'button',
          {
            name:
              /eliminar producto/i,
          },
        )
        .click()

      await page
        .getByRole(
          'button',
          {
            name:
              /sí, eliminar/i,
          },
        )
        .click()

      await expect(
        page
          .locator('article')
          .filter({
            hasText:
              productName,
          }),
      ).toHaveCount(0)

      created = false
    } finally {
      // Limpieza defensiva si la
      // prueba falla después de CREATE.
      if (created) {
        await page.goto(
          '/productos',
        )

        const search =
          page.getByPlaceholder(
            'Buscar por nombre, marca o SKU...',
          )

        await search.fill(
          productName,
        )

        const card =
          page
            .locator('article')
            .filter({
              hasText:
                productName,
            })
            .first()

        if (
          await card
            .isVisible()
            .catch(
              () => false,
            )
        ) {
          await card
            .getByRole(
              'button',
              {
                name:
                  /opciones del producto/i,
              },
            )
            .click()

          await card
            .getByRole(
              'button',
              {
                name:
                  /eliminar producto/i,
              },
            )
            .click()

          await page
            .getByRole(
              'button',
              {
                name:
                  /sí, eliminar/i,
              },
            )
            .click()
        }
      }
    }
  },
)
