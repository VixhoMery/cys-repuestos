import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ImagePlus, Link, X } from 'lucide-react'

import {
  createProductSchema,
  editProductSchema,
  type CreateProductInput,
  type EditProductInput,
} from '@cys-repuestos/schemas'

import type {
  ProductFormImage,
} from '../../lib/productImages'

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
      initialImages?: ProductFormImage[]
      onSubmit: (
        data: CreateProductInput,
        images: ProductFormImage[],
      ) => void
    }
  | {
      mode: 'edit'
      defaultValues: Partial<EditProductInput>
      initialImages?: ProductFormImage[]
      onSubmit: (
        data: EditProductInput,
        images: ProductFormImage[],
      ) => void
    }

function ProductForm(props: ProductFormProps) {
  const isEdit = props.mode === 'edit'

  const [images, setImages] = useState<ProductFormImage[]>(
    () => props.initialImages ?? [],
  )
  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [imageError, setImageError] = useState('')

  const imagesRef = useRef(images)

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.type === 'file') {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
    }
  }, [])

  const schema = isEdit
    ? editProductSchema
    : createProductSchema

  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: props.defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const netPriceField =
    register('netPrice')

  const priceField =
    register('price')

  const netPriceValue =
    watch('netPrice')

  const normalizedNetPrice =
    String(netPriceValue ?? '')
      .replace(/\D/g, '')

  const netPriceNumber =
    Number(normalizedNetPrice)

  const priceWithTax =
    netPriceNumber > 0
      ? Math.round(
          netPriceNumber * 1.19,
        )
      : ''


  const handleImages = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setImageError('')

    const selectedFiles = Array.from(
      event.target.files ?? [],
    )

    if (selectedFiles.length === 0) return

    const invalidType = selectedFiles.find(
      (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type),
    )

    if (invalidType) {
      setImageError('Solo se permiten imágenes JPG, PNG o WebP.')
      event.target.value = ''
      return
    }

    const tooLarge = selectedFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE,
    )

    if (tooLarge) {
      setImageError('Cada imagen debe pesar como máximo 5 MB.')
      event.target.value = ''
      return
    }

    const newFiles = selectedFiles.filter(
      (selectedFile) =>
        !images.some(
          (currentImage) =>
            currentImage.type === 'file' &&
            currentImage.file.name === selectedFile.name &&
            currentImage.file.size === selectedFile.size &&
            currentImage.file.lastModified === selectedFile.lastModified,
        ),
    )

    const remainingSlots = MAX_IMAGES - images.length

    if (remainingSlots <= 0) {
      setImageError('Puedes agregar un máximo de 3 imágenes.')
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

    const fileImages: ProductFormImage[] = newFiles
      .slice(0, remainingSlots)
      .map((file) => ({
        type: 'file',
        file,
        previewUrl: URL.createObjectURL(file),
      }))

    setImages((currentImages) => [
      ...currentImages,
      ...fileImages,
    ])

    event.target.value = ''
  }

  const addExternalImage = () => {
    setImageError('')

    if (images.length >= MAX_IMAGES) {
      setImageError('Puedes agregar un máximo de 3 imágenes.')
      return
    }

    const value = externalImageUrl.trim()

    if (!value) {
      setImageError('Ingresa una URL de imagen.')
      return
    }

    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('invalid protocol')
      }
    } catch {
      setImageError(
        'Ingresa una URL válida que comience con http:// o https://.',
      )
      return
    }

    const duplicate = images.some((image) => {
      if (image.type === 'external') return image.externalUrl === value
      if (image.type === 'existing') return image.externalUrl === value
      return false
    })

    if (duplicate) {
      setImageError('Esa imagen ya fue agregada.')
      return
    }

    setImages((currentImages) => [
      ...currentImages,
      {
        type: 'external',
        externalUrl: value,
        previewUrl: value,
      },
    ])

    setExternalImageUrl('')
  }

  const removeImage = (indexToRemove: number) => {
    const image = images[indexToRemove]

    if (image?.type === 'file') {
      URL.revokeObjectURL(image.previewUrl)
    }

    setImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove),
    )

    setImageError('')
  }

  const submitHandler = async (
    data: CreateProductInput | EditProductInput,
  ) => {
    if (props.mode === 'edit') {
      await props.onSubmit(
        data as EditProductInput,
        images,
      )
    } else {
      await props.onSubmit(
        data as CreateProductInput,
        images,
      )
    }
  }

  return (
    <form
      autoComplete="off"
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
              autoComplete="off"
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
            <p className="mt-1 text-xs text-red-600">
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
              autoComplete="off"
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
              <p className="mt-1 text-xs text-red-600">
                {String(errors.brand.message)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              SKU
            </label>

            <input
              autoComplete="off"
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
              <p className="mt-1 text-xs text-red-600">
                {String(errors.sku.message)}
              </p>
            )}
          </div>
        </div>

        {/* Categoría + Valor neto */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Categoría
            </label>

            <input
              autoComplete="off"
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
              <p className="mt-1 text-xs text-red-600">
                {String(errors.category.message)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valor neto
            </label>

            <input
              autoComplete="off"
              {...netPriceField}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => {
                event.target.value =
                  event.target.value.replace(
                    /\D/g,
                    '',
                  )

                netPriceField.onChange(event)
              }}
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

            {errors.netPrice && (
              <p className="mt-1 text-xs text-red-600">
                {String(errors.netPrice.message)}
              </p>
            )}
          </div>
        </div>

        {/* Valor con IVA + Valor de venta */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valor con IVA (19%)
            </label>

            <input
              autoComplete="off"
              type="text"
              inputMode="numeric"
              value={priceWithTax}
              readOnly
              className="
                w-full rounded-lg
                border border-slate-300
                bg-slate-50
                px-4 py-3
                text-slate-600
                outline-none
              "
            />

            <p className="mt-1 text-xs text-slate-500">
              Calculado automáticamente desde el valor neto.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valor de venta
            </label>

            <input
              autoComplete="off"
              {...priceField}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => {
                event.target.value =
                  event.target.value.replace(
                    /\D/g,
                    '',
                  )

                priceField.onChange(event)
              }}
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
              <p className="mt-1 text-xs text-red-600">
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
              autoComplete="off"
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
            <p className="mt-1 text-xs text-red-600">
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
              autoComplete="off"
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
            <p className="mt-1 text-xs text-red-600">
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
              autoComplete="off"
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
              <p className="mt-1 text-xs text-red-600">
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
                JPG, PNG, WebP o URL pública. Máximo 3 imágenes.
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
              autoComplete="off"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImages}
                className="hidden"
              />
            </label>
          )}

          {/* URL externa */}
          {images.length < MAX_IMAGES && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                O usar imagen desde Internet
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link
                    size={18}
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
              autoComplete="off"
                    type="url"
                    value={externalImageUrl}
                    onChange={(event) =>
                      setExternalImageUrl(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addExternalImage()
                      }
                    }}
                    placeholder="https://sitio.com/imagen.jpg"
                    className="
                      w-full rounded-lg
                      border border-slate-300
                      py-3 pl-11 pr-4
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                <button
                  type="button"
                  onClick={addExternalImage}
                  className="
                    rounded-lg
                    border border-slate-300
                    bg-white
                    px-4 py-3
                    font-medium text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  Agregar URL
                </button>
              </div>
            </div>
          )}

          {/* Mensajes */}
          {imageError && (
            <p className="mt-2 text-sm text-red-600">
              {imageError}
            </p>
          )}

          {/* Previews */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={
                    image.type === 'file'
                      ? `${image.file.name}-${image.file.lastModified}`
                      : image.type === 'existing'
                        ? `existing-${image.id}`
                        : `external-${image.externalUrl}`
                  }
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
                    src={image.previewUrl}
                    alt={`Vista previa ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
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
              ))}
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