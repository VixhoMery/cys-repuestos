import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'Ventas carga registros reales',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/ventas',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Ventas',
          exact: true,
        },
      ),
    ).toBeVisible()

    const salesCard =
      page
        .getByText(
          'Ventas encontradas',
          {
            exact: true,
          },
        )
        .locator('..')

    await expect(
      salesCard,
    ).not.toContainText(
      /^0$/,
    )

    await expect(
      page.getByText(
        /@cys-demo\.cl|usuario@ejemplo\.com/,
      ).first(),
    ).toBeVisible()
  },
)


test(
  'Estadísticas recalcula el período Año con ventas reales',
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
            'Estadísticas',
          exact: true,
        },
      ),
    ).toBeVisible()

    await page
      .getByRole(
        'button',
        {
          name:
            'Año',
          exact: true,
        },
      )
      .click()

    const salesCard =
      page
        .getByText(
          'Ventas registradas',
          {
            exact: true,
          },
        )
        .locator('..')

    await expect(
      salesCard,
    ).toContainText(
      'Este año',
    )

    const salesValue =
      salesCard
        .locator('p')
        .nth(1)

    await expect(
      salesValue,
    ).not.toHaveText(
      '0',
    )

    const totalCard =
      page
        .getByText(
          'Total vendido',
          {
            exact: true,
          },
        )
        .first()
        .locator('..')

    const totalValue =
      totalCard
        .locator('p')
        .nth(1)

    await expect(
      totalValue,
    ).not.toHaveText(
      '$0',
    )
  },
)
