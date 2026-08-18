import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ImagePlus, X } from 'lucide-react'

import {
  createProductSchema,
  editProductSchema,
  type CreateProductInput,
  type EditProductInput,
} from '@cys-repuestos/schemas'

const MAX_IMAGES = 3
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

type ProductFormProps =
  | {
      mode: 'create'
      defaultValues?: Partial<CreateProductInput>
      onSubmit: (
        data: CreateProductInput,
        images: File[],
      ) => void
    }
  | {
      mode: 'edit'
      defaultValues: Partial<EditProductInput>
      onSubmit: (
        data: EditProductInput,
        images: File[],
      ) => void
    }

function ProductForm(props: ProductFormProps) {
  const isEdit = props.mode === 'edit'

  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState('')

  const schema = isEdit
    ? editProductSchema
    : createProductSchema

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: props.defaultValues,
  })

  // Creamos URLs temporales solamente para mostrar previews.
  const imagePreviews = useMemo(
    () =>
      images.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [images],
  )

  const handleImages = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setImageError('')

    const selectedFiles = Array.from(
      event.target.files ?? [],
    )

    if (selectedFiles.length === 0) {
      return
    }

    // Validar formato
    const invalidType = selectedFiles.find(
      (file) =>
        !ACCEPTED_IMAGE_TYPES.includes(file.type),
    )

    if (invalidType) {
      setImageError(
        'Solo se permiten imágenes JPG, PNG o WebP.',
      )

      event.target.value = ''
      return
    }

    // Validar peso
    const tooLarge = selectedFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE,
    )

    if (tooLarge) {
      setImageError(
        'Cada imagen debe pesar como máximo 5 MB.',
      )

      event.target.value = ''
      return
    }

    // Evitar subir dos veces exactamente el mismo archivo
    const newFiles = selectedFiles.filter(
      (selectedFile) =>
        !images.some(
          (currentImage) =>
            currentImage.name === selectedFile.name &&
            currentImage.size === selectedFile.size &&
            currentImage.lastModified ===
              selectedFile.lastModified,
        ),
    )

    const remainingSlots =
      MAX_IMAGES - images.length

    if (remainingSlots <= 0) {
      setImageError(
        'Puedes agregar un máximo de 3 imágenes.',
      )

      event.target.value = ''
      return
    }

    if (newFiles.length > remainingSlots) {
      setImageError(
        `Solo puedes agregar ${
          remainingSlots === 1
            ? '1 imagen más'
            : `${remainingSlots} imágenes más`
        }.`,
      )
    }

    setImages((currentImages) => [
      ...currentImages,
      ...newFiles.slice(0, remainingSlots),
    ])

    // Permite volver a seleccionar el mismo archivo
    // después de eliminarlo.
    event.target.value = ''
  }

  const removeImage = (indexToRemove: number) => {
    setImages((currentImages) =>
      currentImages.filter(
        (_, index) => index !== indexToRemove,
      ),
    )

    setImageError('')
  }

  const submitHandler = (
    data: CreateProductInput | EditProductInput,
  ) => {
    if (props.mode === 'edit') {
      props.onSubmit(
        data as EditProductInput,
        images,
      )
    } else {
      props.onSubmit(
        data as CreateProductInput,
        images,
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="
        mx-auto max-w-2xl
        rounded-2xl
        border border-slate-200
        bg-white
        p-8
        shadow-sm
      "
    >
      <h1 className="mb-8 text-3xl font-bold text-slate-900">
        {isEdit
          ? 'Editar producto'
          : 'Agregar producto'}
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
            className="
              w-full rounded-lg
              border border-slate-300
              px-4 py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
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
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
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
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.sku.message)}
              </p>
            )}
          </div>
        </div>

        {/* Categoría + Precio */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Categoría
            </label>

            <input
              {...register('category')}
              type="text"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
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
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
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
            placeholder="Texto breve que aparecerá en la tarjeta"
            className="
              w-full resize-none rounded-lg
              border border-slate-300
              px-4 py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />

          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-600">
              {String(
                errors.shortDescription.message,
              )}
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
            className="
              w-full resize-none rounded-lg
              border border-slate-300
              px-4 py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {String(errors.description.message)}
            </p>
          )}
        </div>

        {/* Stock: solo edición */}
        {isEdit && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Stock
            </label>

            <input
              {...register('stock')}
              type="number"
              min="0"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.stock.message)}
              </p>
            )}
          </div>
        )}

        {/* Fotografías */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Fotografías
              </label>

              <p className="mt-1 text-sm text-slate-500">
                JPG, PNG o WebP. Máximo 3 imágenes.
              </p>
            </div>

            <span className="text-sm text-slate-500">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>

          {/* Botón de selección */}
          {images.length < MAX_IMAGES && (
            <label
              className="
                flex cursor-pointer
                items-center justify-center
                gap-2
                rounded-xl
                border-2 border-dashed
                border-slate-300
                bg-slate-50
                px-5 py-8
                text-slate-500
                transition
                hover:border-blue-400
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              <ImagePlus size={24} />

              <span className="font-medium">
                Agregar fotografías
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImages}
                className="hidden"
              />
            </label>
          )}

          {/* Mensajes */}
          {imageError && (
            <p className="mt-2 text-sm text-red-600">
              {imageError}
            </p>
          )}

          {/* Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {imagePreviews.map(
                ({ file, url }, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="
                      relative
                      aspect-square
                      overflow-hidden
                      rounded-xl
                      border border-slate-200
                      bg-slate-100
                    "
                  >
                    <img
                      src={url}
                      alt={`Vista previa ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(index)
                      }
                      className="
                        absolute right-2 top-2
                        flex h-8 w-8
                        items-center justify-center
                        rounded-full
                        bg-white/90
                        text-slate-600
                        shadow
                        transition
                        hover:bg-red-500
                        hover:text-white
                      "
                      aria-label="Eliminar fotografía"
                    >
                      <X size={16} />
                    </button>

                    {index === 0 && (
                      <span
                        className="
                          absolute bottom-2 left-2
                          rounded-full
                          bg-slate-900/80
                          px-2.5 py-1
                          text-xs font-medium
                          text-white
                        "
                      >
                        Principal
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Guardar */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full rounded-xl
            bg-blue-600
            px-5 py-3
            font-medium text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
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