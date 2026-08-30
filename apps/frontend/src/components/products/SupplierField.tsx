import {
  useEffect,
  useState,
} from 'react'

import {
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  type Supplier,
} from '../../api/suppliers'

type SupplierFieldProps = {
  register: any
  setValue: any
  watch: any
  errorMessage?: string
}

function SupplierField({
  register,
  setValue,
  watch,
  errorMessage,
}: SupplierFieldProps) {
  const [
    suppliers,
    setSuppliers,
  ] =
    useState<Supplier[]>([])

  const [
    suppliersLoading,
    setSuppliersLoading,
  ] =
    useState(true)

  const [
    supplierLoadError,
    setSupplierLoadError,
  ] =
    useState('')

  const [
    showSupplierModal,
    setShowSupplierModal,
  ] =
    useState(false)

  const [
    newSupplierName,
    setNewSupplierName,
  ] =
    useState('')

  const [
    addingSupplier,
    setAddingSupplier,
  ] =
    useState(false)

  const [
    addSupplierError,
    setAddSupplierError,
  ] =
    useState('')

  const [
    supplierToDelete,
    setSupplierToDelete,
  ] =
    useState<Supplier | null>(
      null,
    )

  const [
    deletingSupplier,
    setDeletingSupplier,
  ] =
    useState(false)

  const [
    deleteSupplierError,
    setDeleteSupplierError,
  ] =
    useState('')

  const selectedSupplierValue =
    watch('supplierId')

  useEffect(() => {
    const loadSuppliers =
      async () => {
        try {
          setSuppliersLoading(
            true,
          )
          setSupplierLoadError(
            '',
          )

          const data =
            await getSuppliers()

          setSuppliers(data)
        } catch (error) {
          console.error(
            'Error cargando proveedores:',
            error,
          )

          setSupplierLoadError(
            'No fue posible cargar los proveedores.',
          )
        } finally {
          setSuppliersLoading(
            false,
          )
        }
      }

    void loadSuppliers()
  }, [])

  const handleAddSupplier =
    async () => {
      const name =
        newSupplierName.trim()

      if (!name) {
        setAddSupplierError(
          'Escribe un nombre para el proveedor.',
        )
        return
      }

      if (
        name.length >
        100
      ) {
        setAddSupplierError(
          'El proveedor no puede superar los 100 caracteres.',
        )
        return
      }

      try {
        setAddingSupplier(
          true,
        )
        setAddSupplierError(
          '',
        )

        const supplier =
          await createSupplier({
            name,
          })

        setSuppliers(
          (
            currentSuppliers,
          ) =>
            [
              ...currentSuppliers,
              supplier,
            ].sort(
              (
                a,
                b,
              ) =>
                a.name.localeCompare(
                  b.name,
                  'es',
                  {
                    sensitivity:
                      'base',
                  },
                ),
            ),
        )

        setValue(
          'supplierId',
          supplier.id,
          {
            shouldDirty:
              true,
            shouldValidate:
              true,
          },
        )

        setNewSupplierName(
          '',
        )
        setShowSupplierModal(
          false,
        )
      } catch (
        error: any
      ) {
        console.error(
          'Error creando proveedor:',
          error,
        )

        setAddSupplierError(
          error?.response
            ?.data
            ?.message ||
            'No fue posible crear el proveedor.',
        )
      } finally {
        setAddingSupplier(
          false,
        )
      }
    }

  const handleDeleteSupplier =
    async () => {
      if (
        !supplierToDelete
      ) {
        return
      }

      try {
        setDeletingSupplier(
          true,
        )
        setDeleteSupplierError(
          '',
        )

        await deleteSupplier(
          supplierToDelete.id,
        )

        setSuppliers(
          (
            currentSuppliers,
          ) =>
            currentSuppliers.filter(
              (
                supplier,
              ) =>
                supplier.id !==
                supplierToDelete.id,
            ),
        )

        if (
          Number(
            selectedSupplierValue,
          ) ===
          supplierToDelete.id
        ) {
          setValue(
            'supplierId',
            null,
            {
              shouldDirty:
                true,
              shouldValidate:
                true,
            },
          )
        }

        setSupplierToDelete(
          null,
        )
      } catch (
        error: any
      ) {
        console.error(
          'Error eliminando proveedor:',
          error,
        )

        setDeleteSupplierError(
          error?.response
            ?.data
            ?.message ||
            'No fue posible eliminar el proveedor.',
        )
      } finally {
        setDeletingSupplier(
          false,
        )
      }
    }

  return (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="product-supplier"
            className="block text-sm font-medium text-slate-700"
          >
            Proveedor
          </label>

          <button
            type="button"
            onClick={() => {
              setAddSupplierError(
                '',
              )
              setNewSupplierName(
                '',
              )
              setShowSupplierModal(
                true,
              )
            }}
            className="
              inline-flex items-center gap-1
              text-xs font-medium text-blue-600
              transition hover:text-blue-700
            "
          >
            <Plus
              size={15}
            />
            Agregar proveedor
          </button>
        </div>

        <select
          id="product-supplier"
          autoComplete="off"
          {...register(
            'supplierId',
          )}
          disabled={
            suppliersLoading
          }
          className="
            w-full rounded-lg
            border border-slate-300
            bg-white px-4 py-3
            outline-none transition
            focus:border-blue-500
            focus:ring-2 focus:ring-blue-100
            disabled:cursor-wait
            disabled:bg-slate-50
            disabled:text-slate-400
          "
        >
          <option value="">
            {suppliersLoading
              ? 'Cargando proveedores...'
              : 'Sin proveedor'}
          </option>

          {suppliers.map(
            (supplier) => (
              <option
                key={
                  supplier.id
                }
                value={
                  supplier.id
                }
              >
                {
                  supplier.name
                }
              </option>
            ),
          )}
        </select>

        <p className="mt-1 text-xs text-slate-500">
          Opcional.
        </p>

        {supplierLoadError && (
          <p className="mt-1 text-xs text-red-600">
            {
              supplierLoadError
            }
          </p>
        )}

        {errorMessage && (
          <p className="mt-1 text-xs text-red-600">
            {errorMessage}
          </p>
        )}
      </div>

      {showSupplierModal && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-slate-950/40 p-4
          "
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowSupplierModal(
                false,
              )
            }
          }}
        >
          <div
            className="
              w-full max-w-md rounded-2xl
              border border-slate-200
              bg-white p-6 shadow-xl
            "
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Agregar proveedor
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Crea proveedores nuevos o elimina los que ya no tengan productos asociados.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSupplierModal(
                    false,
                  )
                }
                disabled={
                  addingSupplier
                }
                className="
                  rounded-lg p-2 text-slate-400
                  transition hover:bg-slate-100 hover:text-slate-700
                "
                aria-label="Cerrar"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <label
              htmlFor="new-supplier-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nombre del proveedor
            </label>

            <input
              id="new-supplier-name"
              autoFocus
              autoComplete="off"
              type="text"
              maxLength={100}
              value={
                newSupplierName
              }
              onChange={(
                event,
              ) => {
                setNewSupplierName(
                  event.target
                    .value,
                )
                setAddSupplierError(
                  '',
                )
              }}
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  event.preventDefault()
                  void handleAddSupplier()
                }
              }}
              placeholder="Ej: Repuestos González"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3 outline-none transition
                focus:border-blue-500
                focus:ring-2 focus:ring-blue-100
              "
            />

            {addSupplierError && (
              <p className="mt-2 text-xs text-red-600">
                {
                  addSupplierError
                }
              </p>
            )}

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Proveedores existentes
              </p>

              <div
                className="
                  max-h-52 overflow-y-auto
                  rounded-xl
                  border border-slate-200
                  divide-y divide-slate-100
                "
              >
                {suppliers.length ===
                0 ? (
                  <p className="px-3 py-4 text-sm text-slate-400">
                    Aún no hay proveedores.
                  </p>
                ) : (
                  suppliers.map(
                    (
                      supplier,
                    ) => (
                      <div
                        key={
                          supplier.id
                        }
                        className="
                          flex items-center
                          justify-between gap-3
                          px-3 py-2.5
                        "
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {
                              supplier.name
                            }
                          </p>

                          <p className="text-xs text-slate-400">
                            {supplier.productCount ===
                            1
                              ? '1 producto asociado'
                              : `${supplier.productCount} productos asociados`}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            supplier.productCount >
                            0
                          }
                          onClick={() => {
                            setDeleteSupplierError(
                              '',
                            )
                            setSupplierToDelete(
                              supplier,
                            )
                          }}
                          title={
                            supplier.productCount >
                            0
                              ? 'Primero elimina o reasigna los productos de este proveedor'
                              : `Eliminar ${supplier.name}`
                          }
                          aria-label={`Eliminar proveedor ${supplier.name}`}
                          className="
                            flex h-9 w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-red-50
                            hover:text-red-600
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                            disabled:hover:bg-transparent
                            disabled:hover:text-slate-400
                          "
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowSupplierModal(
                    false,
                  )
                }
                disabled={
                  addingSupplier
                }
                className="
                  rounded-lg border border-slate-300
                  px-4 py-2.5 text-sm font-medium
                  text-slate-700 transition hover:bg-slate-50
                  disabled:opacity-60
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleAddSupplier()
                }
                disabled={
                  addingSupplier
                }
                className="
                  inline-flex items-center gap-2
                  rounded-lg bg-blue-600
                  px-4 py-2.5 text-sm font-medium text-white
                  transition hover:bg-blue-700
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                <Plus
                  size={17}
                />
                {addingSupplier
                  ? 'Guardando...'
                  : 'Agregar proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {supplierToDelete && (
        <div
          className="
            fixed inset-0 z-[60]
            flex items-center justify-center
            bg-slate-950/50 p-4
          "
        >
          <div
            className="
              w-full max-w-sm
              rounded-2xl
              border border-slate-200
              bg-white p-6
              shadow-xl
            "
          >
            <h2 className="text-lg font-semibold text-slate-900">
              ¿Eliminar proveedor?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Vas a eliminar{' '}
              <span className="font-medium text-slate-700">
                {
                  supplierToDelete.name
                }
              </span>
              . Esta acción no se puede deshacer.
            </p>

            {deleteSupplierError && (
              <p className="mt-3 text-xs text-red-600">
                {
                  deleteSupplierError
                }
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={
                  deletingSupplier
                }
                onClick={() => {
                  setSupplierToDelete(
                    null,
                  )
                  setDeleteSupplierError(
                    '',
                  )
                }}
                className="
                  rounded-lg
                  border border-slate-300
                  px-4 py-2.5
                  text-sm font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:opacity-60
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  deletingSupplier
                }
                onClick={() =>
                  void handleDeleteSupplier()
                }
                className="
                  inline-flex items-center gap-2
                  rounded-lg
                  bg-red-600
                  px-4 py-2.5
                  text-sm font-medium
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Trash2
                  size={17}
                />
                {deletingSupplier
                  ? 'Eliminando...'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SupplierField
