import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'crédito exige seleccionar cantidad de cuotas',
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

    await paymentSelect
      .selectOption(
        'credito',
      )

    const installmentsSelect =
      page.getByLabel(
        'Cuotas',
        {
          exact: true,
        },
      )

    await expect(
      installmentsSelect,
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

    await installmentsSelect
      .selectOption(
        '6',
      )

    await expect(
      confirmButton,
    ).toBeEnabled()

    // No registramos una venta real.
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
