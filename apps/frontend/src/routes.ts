import {
  createElement,
  lazy,
  type ComponentType,
} from 'react'

const Products =
  lazy(() =>
    import('./pages/products/Products'),
  )

const POS =
  lazy(() =>
    import('./pages/POS'),
  )

const Sales =
  lazy(() =>
    import('./pages/Sales'),
  )

const Statistics =
  lazy(() =>
    import('./pages/Statistics'),
  )

const ProductDetail =
  lazy(() =>
    import('./pages/products/ProductDetail'),
  )

const NewProduct =
  lazy(() =>
    import('./pages/products/NewProduct'),
  )

const EditProduct =
  lazy(() =>
    import('./pages/products/EditProduct'),
  )

const Login =
  lazy(() =>
    import('./pages/auth/Login'),
  )

const Register =
  lazy(() =>
    import('./pages/auth/Register'),
  )

interface RouteConfig {
  path: string
  component: ComponentType
  private?: boolean
  restricted?: boolean
  adminOnly?: boolean
}

export const routes: RouteConfig[] = [
  {
    path: '/productos',
    component: () =>
      createElement(Products),
    private: true,
  },
  {
    path: '/pos',
    component: () =>
      createElement(POS),
    private: true,
  },
  {
    path: '/ventas',
    component: () =>
      createElement(Sales),
    private: true,
  },
  {
    path: '/estadisticas',
    component: () =>
      createElement(Statistics),
    private: true,
  },

  {
    path: '/productos/:id',
    component: () =>
      createElement(ProductDetail),
    private: true,
  },
  {
    path: '/productos/nuevo',
    component: () =>
      createElement(NewProduct),
    private: true,
  },
  {
    path: '/productos/:id/editar',
    component: () =>
      createElement(EditProduct),
    private: true,
  },

  {
    path: '/login',
    component: () =>
      createElement(Login),
    private: false,
    restricted: true,
  },
  {
    path: '/registro',
    component: () =>
      createElement(Register),
    private: false,
    restricted: true,
  },
]
