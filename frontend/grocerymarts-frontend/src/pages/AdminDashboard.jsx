import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Edit,
  Eye,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categoriesAPI, ordersAPI, productsAPI, userAPI } from '../lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await productsAPI.getProducts({ limit: 100 });
      setProducts(productsResponse.data.products);
      
      // Fetch orders
      const ordersResponse = await ordersAPI.getAllOrders({ limit: 100 });
      setOrders(ordersResponse.data.orders);
      
      // Fetch users
      const usersResponse = await userAPI.getAllUsers({ limit: 100 });
      setUsers(usersResponse.data.users);
      
      // Calculate stats
      const totalRevenue = ordersResponse.data.orders.reduce((sum, order) => sum + order.total_amount, 0);
      
      setStats({
        totalUsers: usersResponse.data.total,
        totalProducts: productsResponse.data.total,
        totalOrders: ordersResponse.data.total,
        totalRevenue: totalRevenue
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const ProductsTab = () => {
    const [showForm, setShowForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
      name: '',
      category: '',
      price: '',
      stock: '',
      imageUrl: '',
      description: ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [editProduct, setEditProduct] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);

    // Fetch categories on mount
    useEffect(() => {
      fetchCategories();
    }, []);

    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const handleChange = (e) => {
      if (e.target.name === 'image') {
        setForm({ ...form, image: e.target.files[0] });
        setImagePreview(URL.createObjectURL(e.target.files[0]));
      } else {
        setForm({ ...form, [e.target.name]: e.target.value });
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('category', form.category);
        formData.append('price', form.price);
        formData.append('stock', form.stock);
        formData.append('description', form.description);
        
        // Only append image_url if no image file was selected
        if (form.image) {
          formData.append('image', form.image);
        } else if (form.imageUrl) {
          formData.append('image_url', form.imageUrl);
        }
        
        if (editProduct) {
          // Edit mode
          await productsAPI.updateProduct(editProduct._id, formData);
          alert('Product updated!');
          setEditProduct(null);
        } else {
          // Add mode
          await productsAPI.createProduct(formData);
          alert(`Product Added: ${form.name}`);
        }
        setShowForm(false);
        setForm({ name: '', category: '', price: '', stock: '', image: null, imageUrl: '', description: '' });
        setImagePreview(null);
        fetchDashboardData(); // Refresh products
      } catch (error) {
        console.error('Product save error:', error);
        const errorMsg = error.response?.data?.message || 'Failed to save product.';
        alert(errorMsg);
      }
    };

    const handleView = (product) => {
      setViewProduct(product);
    };

    const ProductViewModal = ({ product, onClose }) => {
      if (!product) return null;

      // Example analysis (replace with real data if available)
      const totalSold = product.totalSold || 0; // You may need to fetch this from backend
      const totalEarnings = product.price * totalSold;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2">{product.name}</h2>
            <img
              src={product.imageUrl || (product.image && URL.createObjectURL(product.image))}
              alt={product.name}
              className="mb-4 h-40 w-40 object-cover rounded"
            />
            <div className="mb-2">
              <strong>Category:</strong> {product.category}
            </div>
            <div className="mb-2">
              <strong>Price:</strong> ₹{product.price}
            </div>
            <div className="mb-2">
              <strong>Stock:</strong> {product.stock}
            </div>
            <div className="mb-2">
              <strong>Total Sold:</strong> {totalSold}
            </div>
            <div className="mb-2">
              <strong>Total Earnings:</strong> ₹{totalEarnings}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      );
    };

    const handleEdit = (product) => {
      setEditProduct(product);
      setShowForm(true);
      setForm({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        image: null // You can handle image editing if needed
      });
      setImagePreview(product.imageUrl || null); // If you store image URLs
    };

    const handleDelete = async (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          await productsAPI.deleteProduct(productId); // Make sure this API exists
          setProducts(products.filter(product => product._id !== productId));
          alert('Product deleted successfully!');
        } catch (error) {
          alert('Failed to delete product.');
          console.error(error);
        }
      }
    };

    const handleToggleStatus = async (product) => {
      try {
        // Toggle the is_active value
        const updatedProduct = {
          ...product,
          is_active: !product.is_active
        };
        // Call your API to update the product status
        await productsAPI.updateProduct(product._id, { is_active: updatedProduct.is_active });
        // Update local state
        setProducts(products.map(p => p._id === product._id ? { ...p, is_active: updatedProduct.is_active } : p));
        alert(`Product "${product.name}" is now ${updatedProduct.is_active ? 'Active' : 'Inactive'}`);
      } catch (error) {
        alert('Failed to update product status.');
        console.error(error);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Product Management</h3>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                name="category" 
                value={form.category} 
                onChange={handleChange} 
                list="categories-list"
                placeholder="Enter or select category"
                required 
              />
              <datalist id="categories-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Type to search or select from existing categories. New categories are created automatically!</p>
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" value={form.stock} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="image">Upload Product Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" onChange={handleChange} />
              <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, GIF, WebP (Max 5MB)</p>
            </div>
            <div>
              <Label htmlFor="imageUrl">Or Enter Image URL</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={handleChange} />
              <p className="text-xs text-gray-500 mt-1">Use this if you don't want to upload a file</p>
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <Button type="submit">{editProduct ? 'Update' : 'Save'}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setImagePreview(null); }}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b">
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4">₹{product.price}</td>
                    <td className="p-4">{product.stock}</td>
                    <td className="p-4">
                      <Button
                        variant={product.is_active ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleStatus(product)}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Button>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {viewProduct && (
          <ProductViewModal
            product={viewProduct}
            onClose={() => setViewProduct(null)}
          />
        )}
      </div>
    );
  };

  const OrdersTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Order Management</h3>
      
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Items</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Credits Used</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b">
                  <td className="p-4 font-medium">{order.order_number}</td>
                  <td className="p-4">{order.user_id?.name || 'N/A'}</td>
                  <td className="p-4">{order.items.length} items</td>
                  <td className="p-4">₹{order.total_amount}</td>
                  <td className="p-4">₹{order.credits_used}</td>
                  <td className="p-4">
                    <Badge variant={
                      order.status === 'delivered' ? 'default' :
                      order.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState(users);

    useEffect(() => {
      if (searchTerm) {
        setFilteredUsers(users.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      } else {
        setFilteredUsers(users);
      }
    }, [searchTerm, users]);

    const handleDeleteUser = async (userId) => {
      if (!window.confirm('Are you sure you want to delete this user?')) return;
      
      try {
        await userAPI.deleteUser(userId);
        alert('User deleted successfully');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to delete user');
        console.error(error);
      }
    };

    const handleChangeRole = async (userId, newRole) => {
      try {
        await userAPI.updateUserRole(userId, newRole);
        alert('User role updated successfully');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to update user role');
        console.error(error);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">User Management</h3>
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Credits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u._id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">₹{u.points_balance || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ReferralStatsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Referral Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Credits Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,250</div>
            <p className="text-xs text-muted-foreground">Across all referrals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Referral Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Multi-level chains</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Referrer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">John Doe</div>
            <p className="text-xs text-muted-foreground">3 successful referrals</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">
          Detailed referral analytics would include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>Referral chain visualization</li>
          <li>Credits distribution breakdown</li>
          <li>Monthly referral trends</li>
          <li>Top performing referrers</li>
          <li>Referral conversion rates</li>
        </ul>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what's happening with GroceryMarts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered customers"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="In inventory"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description="All time orders"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          icon={DollarSign}
          description="All time revenue"
        />
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="referrals">Referral Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        
        <TabsContent value="referrals">
          <ReferralStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

// productsAPI.js
export const updateProduct = (id, data) => {
  return fetch(`/api/products/${id}`, {
    method: 'PUT', // or PATCH
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
};

