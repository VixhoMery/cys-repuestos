import Products from './pages/products/Products'
import POS from './pages/POS'
import Sales from './pages/Sales'
import Statistics from './pages/Statistics'
import ProductDetail from './pages/products/ProductDetail'
import NewProduct from './pages/products/NewProduct'
import EditProduct from './pages/products/EditProduct'
import Login from './pages/auth/Login'

interface RouteConfig {
  path: string
  component: React.ComponentType
  private?: boolean
  restricted?: boolean
  adminOnly?: boolean
}

export const routes: RouteConfig[] = [
  {
    path: '/productos',
    component: Products,
    private: true,
  },
  {
    path: '/pos',
    component: POS,
    private: true,
  },
  {
    path: '/ventas',
    component: Sales,
    private: true,
  },
  {
    path: '/estadisticas',
    component: Statistics,
    private: true,
  },

  {
    path: '/productos/:id',
    component: ProductDetail,
    private: true,
  },
  {
    path: '/productos/nuevo',
    component: NewProduct,
    private: true,
  },
  {
    path: '/productos/:id/editar',
    component: EditProduct,
    private: true,
  },

  {
    path: '/login',
    component: Login,
    private: false,
    restricted: true,
  },
]

