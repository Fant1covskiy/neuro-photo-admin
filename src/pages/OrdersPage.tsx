import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API_URL = 'https://neuro-photo-backend-production.up.railway.app';

interface Order {
  id: number;
  telegram_user_id: number;
  username: string;
  first_name: string;
  styles: any[];
  photos: string[];
  total_price: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  result_photos: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      alert('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}`, { status: newStatus });
      alert('Статус обновлен!');
      loadOrders();
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('Ошибка обновления статуса');
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!window.confirm('Удалить этот заказ?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/orders/${orderId}`);
      alert('Заказ удален!');
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления заказа');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const uploadResultPhotos = async () => {
    if (!selectedOrder || !selectedFiles || selectedFiles.length === 0) {
      alert('Выберите фотографии для загрузки');
      return;
    }

    setUploadingPhotos(true);
    const formData = new FormData();
    
    Array.from(selectedFiles).forEach(file => {
      formData.append('photos', file);
    });

    try {
      await axios.post(
        `${API_URL}/admin/orders/${selectedOrder.id}/result-photos`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      alert('Фотографии успешно загружены!');
      setSelectedFiles(null);
      loadOrders();
      
      // Обновляем выбранный заказ
      const updatedOrder = await axios.get(`${API_URL}/admin/orders/${selectedOrder.id}`);
      setSelectedOrder(updatedOrder.data);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      alert('Ошибка загрузки фотографий');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const deleteResultPhoto = async (photoUrl: string) => {
    if (!selectedOrder || !window.confirm('Удалить это фото?')) return;

    try {
      await axios.delete(
        `${API_URL}/admin/orders/${selectedOrder.id}/result-photos`,
        { data: { photo_url: photoUrl } }
      );
      
      alert('Фото удалено!');
      const updatedOrder = await axios.get(`${API_URL}/admin/orders/${selectedOrder.id}`);
      setSelectedOrder(updatedOrder.data);
      loadOrders();
    } catch (error) {
      console.error('Ошибка удаления фото:', error);
      alert('Ошибка удаления фотографии');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'В ожидании',
      processing: 'В обработке',
      completed: 'Завершено',
      cancelled: 'Отменено',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-xl text-gray-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Заказы</h1>
        <p className="text-gray-600 mb-8">Управление заказами пользователей</p>

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">Всего заказов</h3>
            <p className="text-3xl font-bold text-purple-600">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">В ожидании</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">В обработке</h3>
            <p className="text-3xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'processing').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">Завершено</h3>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Таблица заказов */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telegram ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Стили</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.first_name || order.username || 'Неизвестно'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.telegram_user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.styles.length} шт.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    ₽{order.total_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">В ожидании</option>
                      <option value="processing">В обработке</option>
                      <option value="completed">Завершено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Просмотр
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Заказов пока нет
            </div>
          )}
        </div>

        {/* Модальное окно просмотра заказа */}
        {selectedOrder && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div 
              className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Заказ #{selectedOrder.id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold">Пользователь:</span>{' '}
                    {selectedOrder.first_name} (@{selectedOrder.username})
                  </div>
                  <div>
                    <span className="font-semibold">Telegram ID:</span>{' '}
                    {selectedOrder.telegram_user_id}
                  </div>
                  <div>
                    <span className="font-semibold">Цена:</span> ₽{selectedOrder.total_price}
                  </div>
                  <div>
                    <span className="font-semibold">Статус:</span>{' '}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Загрузить готовые фото:</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    {selectedFiles && (
                      <p className="mt-2 text-sm text-gray-600">
                        Выбрано файлов: {selectedFiles.length}
                      </p>
                    )}
                    <button
                      onClick={uploadResultPhotos}
                      disabled={!selectedFiles || uploadingPhotos}
                      className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingPhotos ? 'Загрузка...' : 'Загрузить фото'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Исходные фото ({selectedOrder.photos.length}):
                </h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {selectedOrder.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={`${API_URL}/uploads/orders/${photo}`}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ))}
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  Готовые фото ({selectedOrder.result_photos?.length || 0}):
                </h3>
                {selectedOrder.result_photos && selectedOrder.result_photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {selectedOrder.result_photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={`${API_URL}/uploads/results/${photo}`}
                          alt={`Result ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                        />
                        <button
                          onClick={() => deleteResultPhoto(photo)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Удалить"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">Готовых фото пока нет</p>
                )}

                <h3 className="text-lg font-semibold mb-3">Выбранные стили:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedOrder.styles.map((style, idx) => (
                    <div key={idx} className="mb-2">
                      <span className="font-medium">{style.name}</span> - ₽{style.price}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
