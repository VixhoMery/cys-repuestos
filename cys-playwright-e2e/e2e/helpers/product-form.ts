import type {
  Page,
} from '@playwright/test'

function fieldContainer(
  page: Page,
  label: string,
) {
  return page
    .locator('label', {
      hasText: label,
    })
    .first()
    .locator('..')
}

export function inputByLabel(
  page: Page,
  label: string,
) {
  return fieldContainer(
    page,
    label,
  )
    .locator('input')
    .first()
}

export function textareaByLabel(
  page: Page,
  label: string,
) {
  return fieldContainer(
    page,
    label,
  )
    .locator('textarea')
    .first()
}
