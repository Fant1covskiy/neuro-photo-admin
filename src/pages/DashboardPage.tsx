import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { LayoutGrid, Image, ShoppingBag, Users } from 'lucide-react';

const API_URL = 'https://neuro-photo-backend-production.up.railway.app';

interface Stats {
  categories: number;
  styles: number;
  orders: number;
  users: number;
}

interface Order {
  id: number;
  first_name: string;
  username: string;
  total_price: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    categories: 0,
    styles: 0,
    orders: 0,
    users: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  const loadStats = async () => {
    try {
      const [categoriesRes, stylesRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/styles`),
        fetch(`${API_URL}/api/admin/orders`),
      ]);

      const categories = await categoriesRes.json();
      const styles = await stylesRes.json();
      const orders = await ordersRes.json();

      setStats({
        categories: Array.isArray(categories) ? categories.length : 0,
        styles: Array.isArray(styles) ? styles.length : 0,
        orders: Array.isArray(orders) ? orders.length : 0,
        users: 89,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders`);
      const orders = await response.json();
      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'В ожидании',
      processing: 'В обработке',
      completed: 'Завершено',
      cancelled: 'Отменено',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Главная панель</h1>
          <p className="text-gray-600">Добро пожаловать в админ-панель НейроФото</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl">
                <LayoutGrid className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Категории</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.categories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <Image className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Стили</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.styles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-pink-100 rounded-xl">
                <ShoppingBag className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Заказы</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Пользователи</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.users}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Последние заказы</h2>

          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold">#{order.id}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{order.first_name || order.username || 'Пользователь'}</p>
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-purple-600">₽{order.total_price}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Здесь будет список последних заказов...</p>
          )}
        </div>
      </div>
    </div>
  );
}
