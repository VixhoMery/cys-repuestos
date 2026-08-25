import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'POS mantiene carrito al cambiar de página y permite cancelar',
  async ({ page }) => {
    await login(page)

    await page.goto('/pos')

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Punto de Venta',
          exact: true,
        },
      ),
    ).toBeVisible()

    // Busca un producto concreto
    // usando la búsqueda server-side.
    await page
      .getByPlaceholder(
        'Buscar producto...',
      )
      .fill(
        'PAGTEST-NEU-001',
      )

    const productButton =
      page.getByRole(
        'button',
        {
          name:
            /Neumático 175\/65 R14/i,
        },
      )

    await expect(
      productButton,
    ).toBeVisible()

    await productButton.click()

    // El carrito ya tiene el producto.
    await expect(
      page
        .getByText(
          'Neumático 175/65 R14',
          {
            exact: true,
          },
        )
        .last(),
    ).toBeVisible()

    // Limpiar búsqueda vuelve a página 1
    // del catálogo completo.
    await page
      .getByPlaceholder(
        'Buscar producto...',
      )
      .fill('')

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
        /2\/\d+/,
      ),
    ).toBeVisible()

    // El cambio de página NO puede
    // vaciar la venta actual.
    await expect(
      page
        .getByText(
          'Neumático 175/65 R14',
          {
            exact: true,
          },
        )
        .last(),
    ).toBeVisible()

    // No registramos una venta real:
    // la cancelamos.
    await page
      .getByRole(
        'button',
        {
          name:
            'Cancelar venta',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            '¿Cancelar venta?',
          exact: true,
        },
      ),
    ).toBeVisible()

    await page
      .getByRole(
        'button',
        {
          name:
            'Sí, cancelar',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByText(
        'Agrega productos para comenzar una venta.',
        {
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)
