import { useNavigate } from 'react-router'
import ProductForm from '../../components/products/ProductForm'
import type { CreateProductInput } from '@cys-repuestos/schemas'

function NewProduct() {
  const navigate = useNavigate()

  const handleCreateProduct = (data: CreateProductInput) => {
    console.log('Producto nuevo:', data)

    // Más adelante:
    // await productsApi.create(data)

    navigate('/productos')
  }

  return (
    <ProductForm
      mode="create"
      onSubmit={handleCreateProduct}
    />
  )
}

export default NewProduct