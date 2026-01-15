import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Style {
  id: number;
  name: string;
  description: string;
  category_id: number;
  price: number;
  tags: string[];
  preview_image: string | null; // строка, не массив
  is_active: boolean;
  category?: Category;
}

export default function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 0,
    price: 0,
    tags: '',
    is_active: true,
  });

  // внутри страницы всегда работаем с ОДНИМ изображением
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  const API_URL = 'https://neuro-photo-backend-production.up.railway.app';

  useEffect(() => {
    loadStyles();
    loadCategories();
  }, []);

  const loadStyles = async () => {
    try {
      const response = await fetch(`${API_URL}/styles/admin/all`);
      const data = await response.json();
      setStyles(data);
    } catch (error) {
      console.error('Error loading styles:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Разрешены только JPG, PNG и WebP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Максимальный размер файла: 10 МБ');
      return;
    }

    if (!editingStyle) {
      // для нового стиля просто показываем превью локально
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setUploadingPreview(true);
      const formDataUpload = new FormData();
      formDataUpload.append('preview', file);

      const response = await fetch(
        `${API_URL}/styles/admin/${editingStyle.id}/preview`,
        {
          method: 'POST',
          body: formDataUpload,
        },
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки превью');
      }

      const updatedStyle = await response.json();
      // бэкенд отдаёт preview_image как строку
      setPreviewImage(updatedStyle.preview_image || null);
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить изображение. Попробуйте ещё раз.');
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const styleData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        price: Number(formData.price) || 0,
        tags,
        preview_image: previewImage, // одна строка
        is_active: formData.is_active,
      };

      if (editingStyle) {
        await fetch(`${API_URL}/styles/admin/${editingStyle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(styleData),
        });
      } else {
        await fetch(`${API_URL}/styles/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(styleData),
        });
      }

      await loadStyles();
      closeModal();
    } catch (error) {
      console.error('Error saving style:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить стиль?')) return;

    try {
      await fetch(`${API_URL}/styles/admin/${id}`, {
        method: 'DELETE',
      });
      await loadStyles();
    } catch (error) {
      console.error('Error deleting style:', error);
    }
  };

  const toggleActive = async (style: Style) => {
    try {
      await fetch(`${API_URL}/styles/admin/${style.id}/toggle`, {
        method: 'PATCH',
      });
      await loadStyles();
    } catch (error) {
      console.error('Error toggling style:', error);
    }
  };

  const openModal = (style?: Style) => {
    if (style) {
      setEditingStyle(style);
      setFormData({
        name: style.name,
        description: style.description,
        category_id: style.category_id,
        price: style.price,
        tags: Array.isArray(style.tags) ? style.tags.join(', ') : '',
        is_active: style.is_active,
      });
      // приводим к строке
      setPreviewImage(style.preview_image || null);
    } else {
      setEditingStyle(null);
      setFormData({
        name: '',
        description: '',
        category_id: categories[0]?.id || 0,
        price: 0,
        tags: '',
        is_active: true,
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStyle(null);
    setFormData({
      name: '',
      description: '',
      category_id: 0,
      price: 0,
      tags: '',
      is_active: true,
    });
    setPreviewImage(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Стили</h1>
            <p className="text-gray-600">Управление стилями фотографий</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Добавить стиль
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {styles.map((style) => (
            <div
              key={style.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {style.preview_image ? (
                  <img
                    src={style.preview_image}
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Upload className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      style.is_active
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {style.is_active ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {style.is_active ? 'Активен' : 'Скрыт'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
                  {style.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {style.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-purple-600 font-bold text-xl">
                    {style.price} ₽
                  </span>
                  {style.category && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-lg text-xs font-semibold">
                      {style.category.name}
                    </span>
                  )}
                </div>

                {Array.isArray(style.tags) && style.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {style.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {`#${tag}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(style)}
                    className="flex-1 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold"
                  >
                    {style.is_active ? 'Скрыть' : 'Показать'}
                  </button>
                  <button
                    onClick={() => openModal(style)}
                    className="flex-1 px-3 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-semibold"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(style.id)}
                    className="px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {styles.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
            Нет стилей. Добавьте первый стиль.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingStyle ? 'Редактировать стиль' : 'Новый стиль'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* остальная форма без изменений */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Изображение превью
                </label>

                {previewImage && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {!previewImage && (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-semibold">
                        {uploadingPreview ? 'Загрузка...' : 'Нажмите для загрузки'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        JPG, PNG, WebP (макс. 10 МБ)
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* чекбокс и кнопки такие же, как у тебя */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
