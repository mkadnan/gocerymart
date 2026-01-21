import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, ordersAPI, userAPI } from '../lib/api';
import { Copy, Check, Trash2, Plus, Edit2 } from 'lucide-react';

const UserDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    contact: ''
  });
  const [addressForm, setAddressForm] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  useEffect(() => {
    // Fetch user orders, wishlist, addresses
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch fresh user profile from API to ensure referral_code is present
        const profileRes = await authAPI.getProfile();
        const currentUser = profileRes.data.user;

        const ordersRes = await ordersAPI.getMyOrders();
        setOrders(ordersRes.data.orders);

        const wishlistRes = await userAPI.getWishlist();
        setWishlist(wishlistRes.data.wishlist);

        const addressRes = await userAPI.getAddresses();
        setAddresses(addressRes.data.addresses);

        // Set initial profile form values
        if (currentUser) {
          setProfileForm({
            name: currentUser.name || '',
            contact: currentUser.contact || ''
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        // Fallback to context user if API fails
        if (user) {
          setProfileForm({
            name: user.name || '',
            contact: user.contact || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile({
        name: profileForm.name,
        contact: profileForm.contact
      });
      if (result.success) {
        setShowEditProfileDialog(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await userAPI.updateAddress(editingAddress._id, addressForm);
      } else {
        await userAPI.addAddress(addressForm);
      }
      const res = await userAPI.getAddresses();
      setAddresses(res.data.addresses);
      setShowAddressDialog(false);
      setAddressForm({ line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await userAPI.deleteAddress(addressId);
      const res = await userAPI.getAddresses();
      setAddresses(res.data.addresses);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: address.is_default
    });
    setShowAddressDialog(true);
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await userAPI.removeFromWishlist(productId);
      const res = await userAPI.getWishlist();
      setWishlist(res.data.wishlist);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Contact:</strong> {user?.contact || 'N/A'}</p>
            <div className="mt-3">
              <p><strong>Referral Code:</strong></p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono text-sm">
                  {user?.referral_code || 'N/A'}
                </Badge>
                {user?.referral_code && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={copyReferralCode}
                    className="px-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
            <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4">Edit Profile</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditProfile} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      value={profileForm.contact}
                      onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                      placeholder="Your contact number"
                    />
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Wishlist */}
        <Card>
          <CardHeader>
            <CardTitle>Wishlist ({wishlist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {wishlist.length === 0 ? (
              <p className="text-gray-500">No items in wishlist.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wishlist.map(item => (
                  <div key={item.product_id} className="flex justify-between items-start p-2 border rounded hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{item.price}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Addresses ({addresses.length})</CardTitle>
            <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({ line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <Label>Address Line 1 *</Label>
                    <Input
                      required
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>City *</Label>
                      <Input
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Pincode *</Label>
                    <Input
                      required
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="default"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    />
                    <Label htmlFor="default" className="cursor-pointer">Set as default address</Label>
                  </div>
                  <Button type="submit" className="w-full">{editingAddress ? 'Update' : 'Add'} Address</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <p className="text-gray-500">No saved addresses.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {addresses.map(addr => (
                  <div key={addr._id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{addr.line1}</p>
                        {addr.line2 && <p className="text-sm">{addr.line2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.pincode}</p>
                        {addr.is_default && <Badge className="mt-1">Default</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditAddress(addr)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAddress(addr._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border rounded">
              <thead>
                <tr>
                  <th className="p-2 text-left">Order #</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="p-2">{order.order_number}</td>
                    <td className="p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-2">₹{order.total_amount}</td>
                    <td className="p-2">
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button size="sm" variant="outline">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help & Support, Refund */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Need help? Contact our support team for assistance with your orders, account, or other issues.</p>
            <Button variant="outline" className="mt-2">Contact Support</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View your refund requests and status, or request a refund for an eligible order.</p>
            <Button variant="outline" className="mt-2">Request Refund</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;