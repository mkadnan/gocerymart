import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Gift, Package, Shield, ShoppingCart, Truck, Search, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext.jsx';
import { productsAPI, categoriesAPI } from '../lib/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { isAuthenticated } = useAuth(); // ✅ boolean (not a function)
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await categoriesAPI.getCategories();
        const categoryData = categoriesResponse.data.data || [];
        // API returns array of strings, convert to objects if needed
        const formattedCategories = Array.isArray(categoryData) && categoryData.length > 0
          ? typeof categoryData[0] === 'string'
            ? categoryData.map(name => ({ name, _id: name }))
            : categoryData
          : [];
        setCategories(formattedCategories);
        
        // Fetch featured products
        const productsResponse = await productsAPI.getProducts({ limit: 6 });
        const activeProducts = productsResponse.data.products.filter(p => p.is_active);
        setFeaturedProducts(activeProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {   
      navigate('/login');
      return;
    }
    addToCart(product, 1);
  };

  const capitalizeCategory = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Fresh Groceries
              <span className="text-primary"> Delivered</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get the freshest groceries delivered to your doorstep. Earn credits through our referral program and save on every purchase.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-2 h-10"
                  />
                </div>
                <Button type="submit" size="lg">
                  Search
                </Button>
              </div>
            </form>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/products')}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shop Now
              </Button>
              {/* ✅ fixed */}
              {!isAuthenticated && (  
                <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
                  <Gift className="mr-2 h-5 w-5" />
                  Join & Earn Credits
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedCategory('');
                navigate('/products');
              }}
              className="whitespace-nowrap"
            >
              All Categories
            </Button>
            
            {/* Horizontal Categories */}
            {categories.slice(0, 5).map((category) => (
              <Button
                key={category._id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                onClick={() => handleCategorySelect(category.name)}
                className="whitespace-nowrap"
              >
                {capitalizeCategory(category.name)}
              </Button>
            ))}
            
            {/* Categories Dropdown */}
            {categories.length > 5 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    More Categories <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {categories.slice(5).map((category) => (
                    <DropdownMenuItem
                      key={category._id}
                      onClick={() => handleCategorySelect(category.name)}
                    >
                      {capitalizeCategory(category.name)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose GroceryMarts?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to providing the best grocery shopping experience with fresh products and excellent service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Get your groceries delivered within 24 hours of ordering.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">Fresh, high-quality products or your money back.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Referral Rewards</h3>
              <p className="text-gray-600">Earn credits by referring friends and family to our platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Discover our most popular and fresh products</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={getImageUrl(product.image_url)} 
                          alt={product.name} 
                          className="h-full w-full object-cover rounded hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {!product.image_url && (
                        <Package className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant="secondary">{capitalizeCategory(product.category)}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'Fresh and high-quality product'}
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                        <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                      </div>
                      <Button 
                        onClick={() => handleAddToCart(product)} // ✅ fixed
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate('/products')}>
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers and start earning credits today!
          </p>
          {!isAuthenticated ? (  // ✅ fixed
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => navigate('/register')}>
                Sign Up Now
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                Already have an account?
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => navigate('/products')}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Shopping
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
