import {
  createElement,
  lazy,
  type ComponentType,
} from 'react'

import type {
  AppPermission,
} from './context/AuthContext'

const Products =
  lazy(() =>
    import(
      './pages/products/Products'
    ),
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
    import(
      './pages/Statistics'
    ),
  )

const ProductDetail =
  lazy(() =>
    import(
      './pages/products/ProductDetail'
    ),
  )

const NewProduct =
  lazy(() =>
    import(
      './pages/products/NewProduct'
    ),
  )

const EditProduct =
  lazy(() =>
    import(
      './pages/products/EditProduct'
    ),
  )

const Login =
  lazy(() =>
    import(
      './pages/auth/Login'
    ),
  )

const Register =
  lazy(() =>
    import(
      './pages/auth/Register'
    ),
  )

const Users =
  lazy(() =>
    import('./pages/Users'),
  )

const SetPassword =
  lazy(() =>
    import(
      './pages/auth/SetPassword'
    ),
  )

interface RouteConfig {
  path: string
  component: ComponentType

  private?: boolean
  restricted?: boolean

  permission?:
    AppPermission

  managementOnly?: boolean
}

export const routes:
  RouteConfig[] = [
    {
      path:
        '/productos',
      component: () =>
        createElement(
          Products,
        ),
      private: true,
      permission:
        'products.read',
    },

    {
      path:
        '/pos',
      component: () =>
        createElement(POS),
      private: true,
      permission:
        'sales.create',
    },

    {
      path:
        '/ventas',
      component: () =>
        createElement(
          Sales,
        ),
      private: true,
      permission:
        'sales.read',
    },

    {
      path:
        '/estadisticas',
      component: () =>
        createElement(
          Statistics,
        ),
      private: true,
      permission:
        'statistics.read',
    },

    {
      path:
        '/productos/:id',
      component: () =>
        createElement(
          ProductDetail,
        ),
      private: true,
      permission:
        'products.read',
    },

    {
      path:
        '/productos/nuevo',
      component: () =>
        createElement(
          NewProduct,
        ),
      private: true,
      permission:
        'products.create',
    },

    {
      path:
        '/productos/:id/editar',
      component: () =>
        createElement(
          EditProduct,
        ),
      private: true,
      permission:
        'products.update',
    },

    {
      path:
        '/usuarios',
      component: () =>
        createElement(
          Users,
        ),
      private: true,
      managementOnly:
        true,
    },

    {
      path:
        '/login',
      component: () =>
        createElement(
          Login,
        ),
      private: false,
      restricted: true,
    },

    {
      path:
        '/registro',
      component: () =>
        createElement(
          Register,
        ),
      private: false,
      restricted: true,
    },

    {
      path:
        '/establecer-contrasena',
      component: () =>
        createElement(
          SetPassword,
        ),
      private: false,
      restricted: false,
    },
  ]