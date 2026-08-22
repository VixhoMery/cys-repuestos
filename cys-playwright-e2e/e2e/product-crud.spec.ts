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
  textareaByLabel,
} from './helpers/product-form'


async function findProductCard(
  page: Page,
  name: string,
) {
  const search = page.getByPlaceholder(
    'Buscar por nombre, marca o SKU...',
  )

  await search.fill(name)

  return page
    .locator('article')
    .filter({
      hasText: name,
    })
    .first()
}


test(
  'CRUD completo de un producto temporal',
  async ({ page }) => {
    await login(page)

    const stamp = Date.now()

    const productName =
      `E2E Producto ${stamp}`

    const sku =
      `E2E-${stamp}`

    let created = false

    try {
      // -----------------------------
      // CREATE
      // -----------------------------

      await page.goto(
        '/productos/nuevo',
      )

      await inputByLabel(
        page,
        'Nombre del producto',
      ).fill(productName)

      await inputByLabel(
        page,
        'Marca',
      ).fill('Playwright')

      await inputByLabel(
        page,
        'SKU',
      ).fill(sku)

      await inputByLabel(
        page,
        'Categoría',
      ).fill('Motor')

      await inputByLabel(
        page,
        'Precio',
      ).fill('12000')

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
        'Este producto se crea automáticamente y se elimina al terminar la prueba.',
      )

      await page
        .getByRole('button', {
          name: 'Agregar producto',
          exact: true,
        })
        .click()

      await expect(page).toHaveURL(
        /\/productos$/,
      )

      created = true

      // -----------------------------
      // READ
      // -----------------------------

      let card =
        await findProductCard(
          page,
          productName,
        )

      await expect(card).toBeVisible()

      await card.click()

      await expect(
        page.getByRole('heading', {
          name: productName,
          exact: true,
        }),
      ).toBeVisible()

      await expect(
        page.getByText(
          '$12.000',
          {
            exact: true,
          },
        ),
      ).toBeVisible()

      // -----------------------------
      // UPDATE
      // -----------------------------

      await page
        .getByRole('button', {
          name: /editar producto/i,
        })
        .click()

      await inputByLabel(
        page,
        'Precio',
      ).fill('15000')

      await inputByLabel(
        page,
        'Stock',
      ).fill('5')

      await page
        .getByRole('button', {
          name: /guardar cambios/i,
        })
        .click()

      await expect(page).toHaveURL(
        /\/productos\/\d+$/,
      )

      await expect(
        page.getByText(
          '$15.000',
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

      // -----------------------------
      // DELETE
      // -----------------------------

      await page.goto('/productos')

      card =
        await findProductCard(
          page,
          productName,
        )

      await card
        .getByRole('button', {
          name: /opciones del producto/i,
        })
        .click()

      await card
        .getByRole('button', {
          name: /eliminar producto/i,
        })
        .click()

      await page
        .getByRole('button', {
          name: /sí, eliminar/i,
        })
        .click()

      await expect(card).toHaveCount(0)

      created = false
    } finally {
      // Limpieza defensiva:
      // si el test falló después de CREATE,
      // intenta eliminar el producto temporal.
      if (created) {
        await page.goto('/productos')

        const card =
          await findProductCard(
            page,
            productName,
          )

        if (
          await card
            .isVisible()
            .catch(() => false)
        ) {
          await card
            .getByRole('button', {
              name: /opciones del producto/i,
            })
            .click()

          await card
            .getByRole('button', {
              name: /eliminar producto/i,
            })
            .click()

          await page
            .getByRole('button', {
              name: /sí, eliminar/i,
            })
            .click()
        }
      }
    }
  },
)
