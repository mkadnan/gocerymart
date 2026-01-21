import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ordersAPI } from '../lib/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ordersAPI.getMyOrders({ limit: 50 });
      console.log('Orders response:', response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await ordersAPI.cancelOrder(orderId);
      setSuccessMessage(response.data.message || 'Order cancelled successfully');
      setSelectedOrder(null);
      await fetchOrders();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle2 className="h-4 w-4" />,
      processing: <TrendingUp className="h-4 w-4" />,
      shipped: <Package className="h-4 w-4" />,
      delivered: <CheckCircle2 className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />
    };
    return icons[status] || <Package className="h-4 w-4" />;
  };

  const canCancelOrder = (order) => {
    return !['delivered', 'cancelled'].includes(order.status);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
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
            <h1 className="text-4xl font-bold">My Orders</h1>
          </div>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All Orders ({orders.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </Button>
          <Button
            variant={filterStatus === 'processing' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('processing')}
          >
            Processing ({orders.filter(o => o.status === 'processing').length})
          </Button>
          <Button
            variant={filterStatus === 'shipped' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('shipped')}
          >
            Shipped ({orders.filter(o => o.status === 'shipped').length})
          </Button>
          <Button
            variant={filterStatus === 'delivered' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('delivered')}
          >
            Delivered ({orders.filter(o => o.status === 'delivered').length})
          </Button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {filterStatus === 'all' 
                  ? 'No orders yet. Start shopping!' 
                  : `No ${filterStatus} orders found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Order Info */}
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-lg">{order.order_number}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Items Count */}
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-semibold text-lg">{order.items?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} products
                      </p>
                    </div>

                    {/* Total Amount */}
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-lg text-primary">
                        ₹{order.total_amount?.toFixed(2) || 0}
                      </p>
                      {order.credits_used > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          -{order.credits_used} credits used
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Status</p>
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-col">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>

                      {/* Cancel Button - Quick Action */}
                      {canCancelOrder(order) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Details Dialog - Outside the map */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle>Order Details - {selectedOrder.order_number}</DialogTitle>
                  <DialogDescription>
                    Order placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>

                {/* Order Details Content */}
                <div className="space-y-4">
                  {/* Status Timeline */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-3">Order Status</p>
                    <Badge className={`${getStatusColor(selectedOrder.status)} flex items-center gap-1 w-fit mb-2`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="capitalize">{selectedOrder.status}</span>
                    </Badge>
                  </div>

                  {/* Delivery Address */}
                  {selectedOrder.delivery_address && (
                    <div className="border-t pt-4">
                      <p className="font-semibold mb-2">Delivery Address</p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p>{selectedOrder.delivery_address.street}</p>
                        <p>{selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state}</p>
                        <p>{selectedOrder.delivery_address.postal_code}, {selectedOrder.delivery_address.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="border-t pt-4">
                    <p className="font-semibold mb-3">Order Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{item.total_price?.toFixed(2) || 0}</p>
                            <p className="text-xs text-gray-600">₹{item.price_per_unit?.toFixed(2) || 0} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">₹{selectedOrder.subtotal?.toFixed(2) || 0}</span>
                    </div>
                    {selectedOrder.credits_used > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Credits Used:</span>
                        <span>-₹{selectedOrder.credits_used?.toFixed(2) || 0}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{selectedOrder.total_amount?.toFixed(2) || 0}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="border-t pt-4">
                    <p className="text-sm">
                      <span className="text-gray-600">Payment Method:</span>{' '}
                      <span className="font-semibold capitalize">{selectedOrder.payment_method?.replace(/_/g, ' ')}</span>
                    </p>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="border-t pt-4">
                      <p className="font-semibold mb-2">Order Notes</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {canCancelOrder(selectedOrder) && (
                    <div className="border-t pt-4">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          handleCancelOrder(selectedOrder._id);
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Orders;
