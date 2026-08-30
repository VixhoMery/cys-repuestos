import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

test(
  'nuevo producto muestra proveedor, ubicación y stock inicial',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/productos/nuevo',
    )

    await expect(
      page.getByLabel(
        'Proveedor',
        {
          exact: true,
        },
      ),
    ).toBeEnabled()

    await expect(
      page.getByLabel(
        'Ubicación física',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByLabel(
        'Stock',
        {
          exact: true,
        },
      ),
    ).toHaveValue('0')

    await page
      .getByRole(
        'button',
        {
          name:
            'Agregar proveedor',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Agregar proveedor',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)
