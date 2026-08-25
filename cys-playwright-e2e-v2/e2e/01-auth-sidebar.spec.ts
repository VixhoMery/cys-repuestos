import {
  expect,
  test,
} from '@playwright/test'

import {
  getTestCredentials,
  login,
} from './helpers/auth'


test.describe(
  'Autenticación y Sidebar',
  () => {
    test(
      'una ruta privada redirige al login sin sesión',
      async ({ page }) => {
        await page.goto(
          '/productos',
        )

        await expect(
          page,
        ).toHaveURL(
          /\/login$/,
        )

        await expect(
          page.getByRole(
            'button',
            {
              name: /ingresar/i,
            },
          ),
        ).toBeVisible()
      },
    )


    test(
      'login muestra usuario y logout funciona',
      async ({ page }) => {
        const {
          email,
        } =
          getTestCredentials()

        await login(page)

        await expect(
          page.getByText(
            email,
            {
              exact: true,
            },
          ),
        ).toBeVisible()

        await page
          .getByRole(
            'button',
            {
              name:
                'Cerrar sesión',
            },
          )
          .click()

        await expect(
          page,
        ).toHaveURL(
          /\/login$/,
        )
      },
    )
  },
)
