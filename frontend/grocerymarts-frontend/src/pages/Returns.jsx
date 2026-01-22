import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Package, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { ordersAPI, returnsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-returns');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnForm, setReturnForm] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    reason: 'damaged',
    description: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ show: false, returnId: null });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const returnReasons = [
    { value: 'damaged', label: 'Product Damaged' },
    { value: 'defective', label: 'Defective Product' },
    { value: 'not_as_described', label: 'Not As Described' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'expired', label: 'Expired Product' },
    { value: 'poor_quality', label: 'Poor Quality' },
    { value: 'other', label: 'Other' },
  ];

  const returnStatusColors = {
    requested: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    shipped: 'bg-purple-100 text-purple-800',
    received: 'bg-indigo-100 text-indigo-800',
    refunded: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchReturns();
    fetchOrders();
  }, [isAuthenticated]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await returnsAPI.getUserReturns({ limit: 50 });
      setReturns(response.data.returns || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getMyOrders({ limit: 100 });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setShowForm(true);
  };

  const handleProductSelect = (product) => {
    setReturnForm({
      ...returnForm,
      productId: product.product_id,
      productName: product.name,
    });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      alert('Please select an order');
      return;
    }

    const selectedProduct = selectedOrder.items.find(
      item => item.product_id === returnForm.productId
    );

    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const returnAmount = selectedProduct.price * returnForm.quantity;

    try {
      await returnsAPI.createReturnRequest({
        orderId: selectedOrder._id,
        productId: returnForm.productId,
        productName: returnForm.productName,
        quantity: returnForm.quantity,
        reason: returnForm.reason,
        description: returnForm.description,
        returnAmount,
      });

      alert('Return request created successfully!');
      setShowForm(false);
      setReturnForm({
        productId: '',
        productName: '',
        quantity: 1,
        reason: 'damaged',
        description: '',
      });
      setSelectedOrder(null);
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      alert(error.response?.data?.message || 'Error creating return request');
    }
  };

  const handleCancelReturn = async () => {
    try {
      await returnsAPI.cancelReturnRequest(cancelDialog.returnId);
      alert('Return request cancelled successfully');
      setCancelDialog({ show: false, returnId: null });
      fetchReturns();
    } catch (error) {
      console.error('Error cancelling return:', error);
      alert(error.response?.data?.message || 'Error cancelling return');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user-dashboard')}
            className="flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Returns & Refunds</h1>
          <p className="text-gray-600 mt-2">Manage your product returns and refunds</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('my-returns')}
            className={`pb-4 px-4 font-semibold border-b-2 transition ${
              activeTab === 'my-returns'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Returns
          </button>
          <button
            onClick={() => setActiveTab('new-return')}
            className={`pb-4 px-4 font-semibold border-b-2 transition ${
              activeTab === 'new-return'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Request Return
          </button>
        </div>

        {/* My Returns Tab */}
        {activeTab === 'my-returns' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-12 w-12 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading returns...</p>
              </div>
            ) : returns.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No returns yet</p>
                  <p className="text-gray-500 mt-2">You haven't submitted any return requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {returns.map((returnItem) => (
                  <Card key={returnItem._id} className="hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{returnItem.productName}</h3>
                          <p className="text-sm text-gray-600">
                            Order: {returnItem.orderId?.orderNumber || 'N/A'}
                          </p>
                        </div>
                        <Badge className={returnStatusColors[returnItem.status] || 'bg-gray-100'}>
                          {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y">
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-semibold">{returnItem.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="font-semibold capitalize">{returnItem.reason.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Return Amount</p>
                          <p className="font-semibold">₹{returnItem.returnAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Refund Amount</p>
                          <p className="font-semibold">₹{returnItem.refundAmount || 0}</p>
                        </div>
                      </div>

                      {returnItem.description && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="text-sm">{returnItem.description}</p>
                        </div>
                      )}

                      {returnItem.adminNotes && (
                        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900">Admin Notes</p>
                          <p className="text-sm text-blue-800">{returnItem.adminNotes}</p>
                        </div>
                      )}

                      {returnItem.trackingNumber && (
                        <div className="mb-4 p-3 bg-purple-50 rounded">
                          <p className="text-sm text-gray-600">Return Tracking Number</p>
                          <p className="font-semibold text-purple-900">{returnItem.trackingNumber}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-gray-600">
                          Requested on {new Date(returnItem.requestedAt).toLocaleDateString()}
                        </div>
                        {['requested', 'approved'].includes(returnItem.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelDialog({ show: true, returnId: returnItem._id })}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Return Tab */}
        {activeTab === 'new-return' && (
          <div>
            {!showForm ? (
              <div className="space-y-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Return Policy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-600">
                    <p>✓ You can return products within 30 days of purchase</p>
                    <p>✓ Products must be in resalable condition</p>
                    <p>✓ Full refund will be processed after inspection</p>
                    <p>✓ We'll provide return shipping label</p>
                  </CardContent>
                </Card>

                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No orders found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg mb-4">Select an Order</h3>
                    {orders.map((order) => (
                      <Card
                        key={order._id}
                        className="cursor-pointer hover:shadow-md transition hover:border-primary"
                        onClick={() => handleOrderSelect(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{order.total}</p>
                              <Badge variant="outline">
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {order.items.map((item, idx) => (
                              <Badge key={idx} variant="secondary">{item.name}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle>Return Request Form</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedOrder(null);
                        setReturnForm({
                          productId: '',
                          productName: '',
                          quantity: 1,
                          reason: 'damaged',
                          description: '',
                        });
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <form onSubmit={handleSubmitReturn} className="space-y-6">
                    {/* Selected Order Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Selected Order</p>
                      <p className="font-semibold">Order #{selectedOrder.orderNumber}</p>
                    </div>

                    {/* Product Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product to Return
                      </label>
                      <select
                        value={returnForm.productId}
                        onChange={(e) => {
                          const product = selectedOrder.items.find(
                            item => item.product_id === e.target.value
                          );
                          if (product) handleProductSelect(product);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Select a product...</option>
                        {selectedOrder.items.map((item) => (
                          <option key={item.product_id} value={item.product_id}>
                            {item.name} - ₹{item.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity to Return
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={
                          selectedOrder.items.find(item => item.product_id === returnForm.productId)
                            ?.quantity || 1
                        }
                        value={returnForm.quantity}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Reason
                      </label>
                      <select
                        value={returnForm.reason}
                        onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        {returnReasons.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={returnForm.description}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, description: e.target.value })
                        }
                        placeholder="Please provide details about why you want to return this product..."
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Refund Amount */}
                    {returnForm.productId && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Estimated Refund Amount</p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{(selectedOrder.items.find(item => item.product_id === returnForm.productId)?.price || 0) * returnForm.quantity}
                        </p>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Return Request
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setSelectedOrder(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Cancel Return Dialog */}
      <AlertDialog open={cancelDialog.show} onOpenChange={(open) => setCancelDialog({ ...cancelDialog, show: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Return Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this return request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReturn} className="bg-red-600 hover:bg-red-700">
              Cancel Return
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Returns;
