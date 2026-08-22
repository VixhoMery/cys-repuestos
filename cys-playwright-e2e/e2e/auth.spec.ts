import {
  expect,
  test,
} from '@playwright/test'

import {
  login,
} from './helpers/auth'


test.describe('Autenticación', () => {
  test(
    'una ruta privada redirige al login sin sesión',
    async ({ page }) => {
      await page.goto('/productos')

      await expect(page).toHaveURL(
        /\/login$/,
      )

      await expect(
        page.getByRole('button', {
          name: /ingresar/i,
        }),
      ).toBeVisible()
    },
  )

  test(
    'usuario válido puede entrar y cerrar sesión',
    async ({ page }) => {
      await login(page)

      await page
        .getByRole('button', {
          name: /cerrar sesión/i,
        })
        .click()

      await expect(page).toHaveURL(
        /\/login$/,
      )
    },
  )
})
