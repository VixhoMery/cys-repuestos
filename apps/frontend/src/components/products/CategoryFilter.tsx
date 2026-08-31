import {
  useEffect,
  useState,
} from 'react'

import {
  getCategories,
  type Category,
} from '../../api/categories'

type CategoryFilterProps = {
  selectedCategory: string
  onSelectCategory: (
    category: string,
  ) => void
}

function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const [categories, setCategories] =
    useState<Category[]>([])

  const [
    showAllCategories,
    setShowAllCategories,
  ] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data =
          await getCategories()

        setCategories(data)
      } catch (error) {
        console.error(
          'Error cargando categorías:',
          error,
        )
      }
    }

    loadCategories()
  }, [])

  const categoryNames = [
    'Todos',
    ...categories.map(
      (category) => category.name,
    ),
  ]

  const visibleCategoryNames =
    showAllCategories
      ? categoryNames
      : categoryNames.slice(0, 7)

  return (
    <aside className="w-full lg:w-56">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">
        Categorías
      </h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {visibleCategoryNames.map(
          (category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                onSelectCategory(
                  category,
                )
              }
              className={`
                block w-full
                border-b border-slate-200
                px-5 py-4
                text-left
                transition
                ${
                  selectedCategory ===
                  category
                    ? 'bg-blue-600 font-medium text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {category}
            </button>
          ),
        )}

        {categoryNames.length > 7 && (
          <button
            type="button"
            onClick={() =>
              setShowAllCategories(
                (current) => !current,
              )
            }
            className="
              block w-full
              px-5 py-4
              text-left
              font-medium
              text-blue-600
              transition
              hover:bg-blue-50
            "
          >
            {showAllCategories
              ? 'Mostrar menos'
              : `Mostrar todas (${categories.length})`}
          </button>
        )}
      </div>
    </aside>
  )
}

export default CategoryFilter