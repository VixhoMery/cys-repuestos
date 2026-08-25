import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

import {
  selectByLabel,
} from './helpers/product-form'


test(
  'categorías cargan y una duplicada es rechazada',
  async ({ page }) => {
    await login(page)

    await page.goto(
      '/productos/nuevo',
    )

    const categorySelect =
      selectByLabel(
        page,
        'Categoría',
      )

    await expect(
      categorySelect,
    ).toBeEnabled()

    await categorySelect.selectOption(
      {
        label: 'Motor',
      },
    )

    await expect(
      categorySelect,
    ).toHaveValue(
      'Motor',
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
      .click()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Agregar categoría',
          exact: true,
        },
      ),
    ).toBeVisible()

    await page
      .getByPlaceholder(
        'Ej: Suspensión',
      )
      .fill('Motor')

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

    await expect(
      page.getByText(
        'Esa categoría ya existe.',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    // No crea ninguna categoría
    // nueva: evita ensuciar la BD.
  },
)
