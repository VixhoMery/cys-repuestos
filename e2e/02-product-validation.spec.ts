import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'

import {
  inputByLabel,
  selectByLabel,
  textareaByLabel,
} from './helpers/product-form'


test.describe(
  'Formulario de producto',
  () => {
    test.beforeEach(
      async ({ page }) => {
        await login(page)

        await page.goto(
          '/productos/nuevo',
        )

        await expect(
          selectByLabel(
            page,
            'Categoría',
          ),
        ).toBeEnabled()
      },
    )


    test(
      'muestra errores de campos obligatorios',
      async ({ page }) => {
        await page
          .getByRole(
            'button',
            {
              name:
                'Agregar producto',
              exact: true,
            },
          )
          .click()

        const requiredMessages = [
          'El nombre del producto es obligatorio',
          'La marca es obligatoria',
          'El SKU es obligatorio',
          'La categoría es obligatoria',
          'El valor neto es obligatorio',
          'El valor de venta es obligatorio',
          'La descripción corta es obligatoria',
          'La descripción es obligatoria',
        ]

        for (
          const message
          of requiredMessages
        ) {
          await expect(
            page.getByText(
              message,
              {
                exact: true,
              },
            ),
          ).toBeVisible()
        }
      },
    )


    test(
      'calcula IVA 19% automáticamente',
      async ({ page }) => {
        const netPrice =
          inputByLabel(
            page,
            'Valor neto',
          )

        const priceWithTax =
          inputByLabel(
            page,
            'Valor con IVA',
          )

        await netPrice.fill(
          '100000',
        )

        await expect(
          priceWithTax,
        ).toHaveValue(
          '119000',
        )

        await expect(
          priceWithTax,
        ).toHaveAttribute(
          'readonly',
          '',
        )

        await netPrice.fill(
          '110000',
        )

        await expect(
          priceWithTax,
        ).toHaveValue(
          '130900',
        )
      },
    )


    test(
      'precios aceptan solo dígitos',
      async ({ page }) => {
        const netPrice =
          inputByLabel(
            page,
            'Valor neto',
          )

        const salePrice =
          inputByLabel(
            page,
            'Valor de venta',
          )

        await netPrice.fill(
          'abc100.000',
        )

        await salePrice.fill(
          '$149.990abc',
        )

        await expect(
          netPrice,
        ).toHaveValue(
          '100000',
        )

        await expect(
          salePrice,
        ).toHaveValue(
          '149990',
        )
      },
    )


    test(
      'respeta límites de descripción',
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
            {
              exact: true,
            },
          ),
        ).toBeVisible()

        await description.fill(
          'a'.repeat(1001),
        )

        await description.blur()

        await expect(
          page.getByText(
            'La descripción no puede superar los 1000 caracteres',
            {
              exact: true,
            },
          ),
        ).toBeVisible()
      },
    )
  },
)
