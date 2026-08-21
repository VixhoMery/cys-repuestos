import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router'

import ProductForm from '../../components/products/ProductForm'

import type {
  EditProductInput,
} from '@cys-repuestos/schemas'

import {
  getProductById,
  updateProduct,
} from '../../api/products'


function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [
    product,
    setProduct,
  ] = useState<EditProductInput | null>(
    null,
  )

  const [loading, setLoading] =
    useState(true)


  // ------------------------------------
  // Cargar producto real
  // ------------------------------------

  useEffect(() => {
    const loadProduct = async () => {
      const productId = Number(id)

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        setLoading(false)
        return
      }

      try {
        const data =
          await getProductById(
            productId,
          )

        setProduct({
          name: data.name,
          brand: data.brand,
          sku: data.sku,
          category: data.category,
          price: data.price,
          stock: data.stock,
          shortDescription:
            data.shortDescription,
          description:
            data.description,
        })
      } catch (error) {
        console.error(
          'Error cargando producto:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])


  // ------------------------------------
  // Guardar cambios reales
  // ------------------------------------

  const handleEditProduct = async (
    data: EditProductInput,
    images: File[],
  ) => {
    const productId = Number(id)

    try {
      await updateProduct(
        productId,
        data,
      )

      // Las imágenes todavía no se guardan.
      // Las conectaremos después con Storage.
      console.log(
        'Nuevas fotografías:',
        images,
      )

      navigate(
        `/productos/${productId}`,
      )
    } catch (error) {
      console.error(
        'Error editando producto:',
        error,
      )
    }
  }


  // ------------------------------------
  // Esperar producto
  // ------------------------------------

  if (loading) {
    return (
      <p>
        Cargando producto...
      </p>
    )
  }

  if (!product) {
    return (
      <p>
        Producto no encontrado.
      </p>
    )
  }

  return (
    <ProductForm
      mode="edit"
      defaultValues={product}
      onSubmit={handleEditProduct}
    />
  )
}

export default EditProduct