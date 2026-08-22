import {
  expect,
  type Page,
} from '@playwright/test'

export function getTestCredentials() {
  const email =
    process.env.E2E_TEST_EMAIL

  const password =
    process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      [
        'Faltan las credenciales E2E.',
        'Crea .env.e2e desde .env.e2e.example',
        'y completa E2E_TEST_EMAIL / E2E_TEST_PASSWORD.',
      ].join(' '),
    )
  }

  return {
    email,
    password,
  }
}

export async function login(
  page: Page,
) {
  const {
    email,
    password,
  } = getTestCredentials()

  await page.goto('/login')

  await page
    .locator('input[type="email"]')
    .fill(email)

  await page
    .locator('input[type="password"]')
    .fill(password)

  await page
    .getByRole('button', {
      name: /ingresar/i,
    })
    .click()

  await expect(page).toHaveURL(
    /\/productos$/,
  )

  await expect(
    page.getByRole('heading', {
      name: 'Productos',
      exact: true,
    }),
  ).toBeVisible()
}
