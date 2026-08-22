import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

import {
  inputByLabel,
  textareaByLabel,
} from './helpers/product-form'


test.describe(
  'Validaciones de producto',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await login(page)
        await page.goto(
          '/productos/nuevo',
        )
      },
    )

    test(
      'muestra errores requeridos bajo los campos vacíos',
      async ({ page }) => {
        await page
          .getByRole('button', {
            name: 'Agregar producto',
            exact: true,
          })
          .click()

        await expect(
          page.getByText(
            'El nombre del producto es obligatorio',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'La marca es obligatoria',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'El SKU es obligatorio',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'La categoría es obligatoria',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'El precio es obligatorio',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'La descripción corta es obligatoria',
          ),
        ).toBeVisible()

        await expect(
          page.getByText(
            'La descripción es obligatoria',
          ),
        ).toBeVisible()
      },
    )

    test(
      'respeta límites de descripción y precio numérico',
      async ({ page }) => {
        const shortDescription =
          textareaByLabel(
            page,
            'Descripción corta',
          )

        const description =
          textareaByLabel(
            page,
            'Descripción completa',
          )

        await shortDescription.fill(
          'a'.repeat(51),
        )

        await shortDescription.blur()

        await expect(
          page.getByText(
            'La descripción corta no puede superar los 50 caracteres',
          ),
        ).toBeVisible()

        await description.fill(
          'a'.repeat(121),
        )

        await description.blur()

        await expect(
          page.getByText(
            'La descripción no puede superar los 120 caracteres',
          ),
        ).toBeVisible()

        const price =
          inputByLabel(
            page,
            'Precio',
          )

        await price.fill('abc12.3')

        await expect(price).toHaveValue(
          '123',
        )
      },
    )
  },
)
