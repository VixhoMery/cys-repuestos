type CategoryFilterProps = {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

const categories = [
  'Todos',
  'Motor',
  'Carrocería',
  'Frenos',
  'Neumáticos',
  'Eléctrico',
]

function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <aside className="w-full lg:w-56">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">
        Categorías
      </h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`
              block w-full border-b border-slate-200
              px-5 py-4 text-left
              transition
              last:border-b-0
              ${
                selectedCategory === category
                  ? 'bg-blue-600 font-medium text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>
    </aside>
  )
}

export default CategoryFilter