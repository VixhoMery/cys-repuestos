import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'Estadísticas permite usar un rango personalizado',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/estadisticas',
    )

    await page
      .getByRole(
        'button',
        {
          name:
            'Rango',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByLabel(
        'Desde',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByLabel(
        'Hasta',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByText(
        'Rango personalizado',
        {
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)


test(
  'Estadísticas muestra desglose de pagos y exportaciones',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/estadisticas',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Métodos de pago',
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByText(
        'Efectivo',
        {
          exact: true,
        },
      ).first(),
    ).toBeVisible()

    await expect(
      page.getByRole(
        'button',
        {
          name:
            'Exportar CSV',
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByRole(
        'button',
        {
          name:
            'Imprimir / PDF',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)
