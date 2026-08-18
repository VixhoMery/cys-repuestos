import { useNavigate, useParams } from 'react-router'
import ProductForm from '../../components/products/ProductForm'
import type { EditProductInput } from '@cys-repuestos/schemas'

const mockProduct = {
  name: 'Alternador Toyota Yaris',
  brand: 'Bosch',
  sku: 'ALT-YAR-001',
  category: 'Motor',
  price: 180000,
  stock: 4,
  shortDescription:
    'Alternador compatible con Toyota Yaris modelos 2006–2012.',
  description:
    'Alternador Bosch de 12V compatible con Toyota Yaris modelos 2006–2012.',
}

function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()

  const handleEditProduct = (data: EditProductInput) => {
    console.log(`Editar producto ${id}:`, data)

    // Después:
    // await productsApi.update(id, data)

    navigate(`/productos/${id}`)
  }

  return (
    <ProductForm
      mode="edit"
      defaultValues={mockProduct}
      onSubmit={handleEditProduct}
    />
  )
}

export default EditProduct