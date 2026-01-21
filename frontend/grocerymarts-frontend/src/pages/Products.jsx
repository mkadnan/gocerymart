import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext.jsx';
import { productsAPI, categoriesAPI } from '../lib/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for search/category from URL params
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    fetchProducts();
    fetchCategories();
  }, [searchParams]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({ limit: 100 });
      console.log('Products response:', response.data);
      const activeProducts = response.data.products.filter(p => p.is_active !== false);
      console.log('Active products:', activeProducts);
      setProducts(activeProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      console.log('Categories response:', response.data);
      const categoryNames = response.data.data?.map(cat => cat.name) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
      
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Products</h1>
          </div>
          <p className="text-gray-600">Browse our wide selection of fresh groceries</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Category</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No products found</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <Card key={product._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Product Image */}
                        <div className="bg-gray-200 aspect-square flex items-center justify-center overflow-hidden rounded-t-lg">
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 flex-1">{product.name}</h3>
                            <Badge variant="outline">{product.category}</Badge>
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl font-bold text-primary">
                              ₹{product.price}
                            </div>
                            {product.stock > 0 ? (
                              <Badge variant="success" className="bg-green-100 text-green-800">
                                In Stock ({product.stock})
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Out of Stock
                              </Badge>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <Button
                            className="w-full"
                            disabled={product.stock === 0}
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
