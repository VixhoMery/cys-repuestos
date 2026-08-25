import type {
  Page,
} from '@playwright/test'


function fieldContainer(
  page: Page,
  label: string,
) {
  return page
    .locator('label')
    .filter({
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


// Categoría tiene una estructura distinta:
// <div>
//   <div>
//     <label>Categoría</label>
//     <button>Agregar categoría</button>
//   </div>
//   <select>...</select>
// </div>
//
// Por eso debemos subir dos niveles desde
// el label antes de buscar el select.
export function selectByLabel(
  page: Page,
  label: string,
) {
  return page
    .locator('label')
    .filter({
      hasText: label,
    })
    .first()
    .locator('..')
    .locator('..')
    .locator('select')
    .first()
}
