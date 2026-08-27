import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test(
  'categoría sin productos se puede eliminar y una usada queda bloqueada',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/productos/nuevo',
    )

    // Abrir administrador
    await page
      .getByRole(
        'button',
        {
          name:
            'Agregar categoría',
          exact: true,
        },
      )
      .click()

    // Una categoría usada debe tener
    // el botón de eliminar deshabilitado.
    const motorDelete =
      page.getByRole(
        'button',
        {
          name:
            'Eliminar categoría Motor',
        },
      )

    await expect(
      motorDelete,
    ).toBeDisabled()

    // Crear una categoría temporal.
    const temporaryName =
      `E2E Categoria ${Date.now()}`

    await page
      .getByPlaceholder(
        'Ej: Suspensión',
      )
      .fill(
        temporaryName,
      )

    await page
      .getByRole(
        'button',
        {
          name:
            'Agregar categoría',
          exact: true,
        },
      )
      .last()
      .click()

    // El modal se cierra después de crear.
    await page
      .getByRole(
        'button',
        {
          name:
            'Agregar categoría',
          exact: true,
        },
      )
      .click()

    const deleteTemporary =
      page.getByRole(
        'button',
        {
          name:
            `Eliminar categoría ${temporaryName}`,
        },
      )

    await expect(
      deleteTemporary,
    ).toBeEnabled()

    await deleteTemporary.click()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            '¿Eliminar categoría?',
          exact: true,
        },
      ),
    ).toBeVisible()

    await page
      .getByRole(
        'button',
        {
          name:
            'Sí, eliminar',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByRole(
        'button',
        {
          name:
            `Eliminar categoría ${temporaryName}`,
        },
      ),
    ).toHaveCount(0)
  },
)
