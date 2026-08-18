import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  createProductSchema,
  editProductSchema,
  type CreateProductInput,
  type EditProductInput,
} from '@cys-repuestos/schemas'

type ProductFormProps =
  | {
      mode: 'create'
      defaultValues?: Partial<CreateProductInput>
      onSubmit: (data: CreateProductInput) => void
    }
  | {
      mode: 'edit'
      defaultValues: Partial<EditProductInput>
      onSubmit: (data: EditProductInput) => void
    }

function ProductForm(props: ProductFormProps) {
  const isEdit = props.mode === 'edit'

  const schema = isEdit
    ? editProductSchema
    : createProductSchema

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: props.defaultValues,
  })

  const submitHandler = (data: CreateProductInput | EditProductInput) => {
    if (props.mode === 'edit') {
      props.onSubmit(data as EditProductInput)
    } else {
      props.onSubmit(data as CreateProductInput)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm"
    >
      <h1 className="mb-8 text-3xl font-bold text-slate-900">
        {isEdit ? 'Editar producto' : 'Agregar producto'}
      </h1>

      <div className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nombre del producto
          </label>

          <input
            {...register('name')}
            type="text"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.name.message)}
            </p>
          )}
        </div>

        {/* Marca + SKU */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Marca
            </label>

            <input
              {...register('brand')}
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.brand.message)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              SKU
            </label>

            <input
              {...register('sku')}
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.sku.message)}
              </p>
            )}
          </div>
        </div>

        {/* Categoría + precio */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Categoría
            </label>

            <input
              {...register('category')}
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.category.message)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Precio
            </label>

            <input
              {...register('price')}
              type="number"
              min="0"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.price.message)}
              </p>
            )}
          </div>
        </div>

        {/* Descripción corta */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Descripción corta
          </label>

          <textarea
            {...register('shortDescription')}
            rows={2}
            placeholder="Texto que aparecerá en la tarjeta del producto"
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.shortDescription.message)}
            </p>
          )}
        </div>

        {/* Descripción completa */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Descripción completa
          </label>

          <textarea
            {...register('description')}
            rows={6}
            placeholder="Información detallada del producto"
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.description.message)}
            </p>
          )}
        </div>

        {/* Stock solo al editar */}
        {isEdit && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Stock
            </label>

            <input
              {...register('stock')}
              type="number"
              min="0"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.stock.message)}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Agregar producto'}
        </button>
      </div>
    </form>
  )
}

export default ProductForm