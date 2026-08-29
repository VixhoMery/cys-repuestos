import {
  expect,
  test,
} from '@playwright/test'

test.describe(
  'Registro de cuenta',
  () => {
    test(
      'login permite navegar al registro',
      async ({ page }) => {
        await page.goto(
          '/login',
        )

        await page
          .getByRole(
            'link',
            {
              name:
                'Crear cuenta',
              exact: true,
            },
          )
          .click()

        await expect(
          page,
        ).toHaveURL(
          /\/registro$/,
        )

        await expect(
          page.getByRole(
            'heading',
            {
              name:
                'Crear cuenta',
              exact: true,
            },
          ),
        ).toBeVisible()
      },
    )

    test(
      'registro muestra Google y validación local de contraseña',
      async ({ page }) => {
        await page.goto(
          '/registro',
        )

        await expect(
          page.getByRole(
            'button',
            {
              name:
                'Continuar con Google',
              exact: true,
            },
          ),
        ).toBeVisible()

        await page
          .getByLabel(
            'Nombre',
            {
              exact: true,
            },
          )
          .fill(
            'Usuario Prueba',
          )

        await page
          .getByLabel(
            'Correo electrónico',
            {
              exact: true,
            },
          )
          .fill(
            'prueba@example.com',
          )

        await page
          .getByLabel(
            'Contraseña',
            {
              exact: true,
            },
          )
          .fill(
            '12345678',
          )

        await page
          .getByLabel(
            'Repetir contraseña',
            {
              exact: true,
            },
          )
          .fill(
            '87654321',
          )

        await page
          .getByRole(
            'button',
            {
              name:
                'Crear cuenta',
              exact: true,
            },
          )
          .click()

        await expect(
          page.getByText(
            'Las contraseñas no coinciden.',
            {
              exact: true,
            },
          ),
        ).toBeVisible()
      },
    )
  },
)
