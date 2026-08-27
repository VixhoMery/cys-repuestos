import type {
  Request,
  Response,
} from 'express'

import {
  createCategorySchema,
} from '@cys-repuestos/schemas'

import {
  createCategory,
  deleteCategory,
  getCategories,
} from '../services/categories.service.js'


export async function listCategories(
  _req: Request,
  res: Response,
) {
  try {
    const categories =
      await getCategories()

    return res.json(
      categories,
    )
  } catch (error) {
    console.error(
      'Error cargando categorías:',
      error,
    )

    return res.status(500).json({
      message:
        'Error al cargar las categorías',
    })
  }
}


export async function addCategory(
  req: Request,
  res: Response,
) {
  const validation =
    createCategorySchema.safeParse(
      req.body,
    )

  if (!validation.success) {
    return res.status(400).json({
      message:
        'La categoría no es válida',
      errors:
        validation.error.flatten(),
    })
  }

  try {
    const category =
      await createCategory(
        validation.data.name,
      )

    return res
      .status(201)
      .json(category)
  } catch (error: any) {
    if (
      error?.code === '23505'
    ) {
      return res.status(409).json({
        message:
          'Esa categoría ya existe.',
      })
    }

    console.error(
      'Error creando categoría:',
      error,
    )

    return res.status(500).json({
      message:
        'Error al crear la categoría',
    })
  }
}


export async function removeCategory(
  req: Request,
  res: Response,
) {
  const id =
    Number(req.params.id)

  if (
    !Number.isInteger(id) ||
    id < 1
  ) {
    return res.status(400).json({
      message:
        'La categoría no es válida.',
    })
  }

  try {
    const result =
      await deleteCategory(id)

    if (
      result.status ===
      'not-found'
    ) {
      return res.status(404).json({
        message:
          'La categoría no existe.',
      })
    }

    if (
      result.status ===
      'in-use'
    ) {
      return res.status(409).json({
        message:
          result.productCount === 1
            ? 'No puedes eliminar esta categoría porque tiene 1 producto asociado.'
            : `No puedes eliminar esta categoría porque tiene ${result.productCount} productos asociados.`,
        productCount:
          result.productCount,
      })
    }

    return res.json({
      message:
        'Categoría eliminada correctamente.',
      category:
        result.category,
    })
  } catch (error) {
    console.error(
      'Error eliminando categoría:',
      error,
    )

    return res.status(500).json({
      message:
        'Error al eliminar la categoría.',
    })
  }
}
