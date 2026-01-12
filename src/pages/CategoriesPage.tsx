import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';


interface Category {
  id: number;
  name: string;
  order: number;
  is_active: boolean;
}


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', order: 0, is_active: true });


  useEffect(() => {
    loadCategories();
  }, []);


  const loadCategories = async () => {
    try {
      const response = await fetch('https://neuro-photo-backend-production.up.railway.app/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await fetch(`https://neuro-photo-backend-production.up.railway.app/categories/admin/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('https://neuro-photo-backend-production.up.railway.app/categories/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      
      loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Удалить категорию?')) return;
    
    try {
      await fetch(`https://neuro-photo-backend-production.up.railway.app/categories/admin/${id}`, {
        method: 'DELETE',
      });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };


  const toggleActive = async (category: Category) => {
    try {
      await fetch(`https://neuro-photo-backend-production.up.railway.app/categories/admin/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...category, is_active: !category.is_active }),
      });
      loadCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
    }
  };


  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, order: category.order, is_active: category.is_active });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', order: categories.length + 1, is_active: true });
    }
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', order: 0, is_active: true });
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Категории</h1>
            <p className="text-gray-600">Управление категориями стилей</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Добавить категорию
          </button>
        </div>


        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Название</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Порядок</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Статус</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800">#{category.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{category.name}</td>
                  <td className="px-6 py-4 text-gray-600">{category.order}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {category.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {category.is_active ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={category.is_active ? 'Скрыть' : 'Показать'}
                      >
                        {category.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openModal(category)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Нет категорий. Добавьте первую категорию.
            </div>
          )}
        </div>
      </div>


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
            </h2>


            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
                  placeholder="Например: Аниме"
                  required
                />
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Порядок отображения
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
                  min="1"
                  required
                />
              </div>


              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Активна (отображается в каталоге)
                </label>
              </div>


              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {editingCategory ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
