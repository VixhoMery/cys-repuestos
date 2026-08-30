import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'POS exige método de pago antes de confirmar la venta',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/pos',
    )

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

    await page
      .getByRole(
        'button',
        {
          name:
            'Finalizar venta',
          exact: true,
        },
      )
      .click()

    const paymentSelect =
      page.getByLabel(
        'Método de pago',
        {
          exact: true,
        },
      )

    await expect(
      paymentSelect,
    ).toBeVisible()

    const confirmButton =
      page.getByRole(
        'button',
        {
          name:
            'Confirmar venta',
          exact: true,
        },
      )

    await expect(
      confirmButton,
    ).toBeDisabled()

    await paymentSelect
      .selectOption(
        'efectivo',
      )

    await expect(
      confirmButton,
    ).toBeEnabled()

    // No registramos venta real durante este test.
    await page
      .getByRole(
        'button',
        {
          name:
            'Volver',
          exact: true,
        },
      )
      .click()

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
  },
)


test(
  'historial permite reimprimir comprobante de una venta',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/ventas',
    )

    const firstViewButton =
      page.getByRole(
        'button',
        {
          name:
            'Ver',
          exact: true,
        },
      ).first()

    await expect(
      firstViewButton,
    ).toBeVisible()

    await firstViewButton.click()

    await expect(
      page.getByText(
        'Método de pago',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      page.getByRole(
        'button',
        {
          name:
            'Imprimir comprobante',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)
