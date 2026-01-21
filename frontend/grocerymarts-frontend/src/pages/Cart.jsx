import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext.jsx';

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const [notes, setNotes] = useState('');

  const handleBuy = async () => {
    if (!user) return alert('Please login to place an order.');
    if (!cartItems.length) return alert('Your cart is empty.');

    // Prepare items for backend
    const orderItems = cartItems.map(item => {
      const productId = item.product_id || item.product?._id || item._id;
      console.log('Item:', item.name, 'Product ID:', productId, 'Type:', typeof productId);
      return {
        product_id: productId,
        product_name: item.name,
        quantity: item.quantity,
        price_per_unit: item.price
      };
    });

    // Use provided address or set defaults that meet validation requirements
    const finalAddress = {
      street: address.street || 'Default Street Address, House 123',
      city: address.city || 'Delhi',
      state: address.state || 'Delhi',
      postal_code: address.postal_code || '110001',
      country: address.country || 'India'
    };

    console.log('Placing order with items:', orderItems);
    console.log('Delivery address:', finalAddress);
    
    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({
          items: orderItems,
          credits_to_use: 0,
          payment_method: 'cash_only',
          delivery_address: finalAddress,
          notes
        })
      });
      
      const data = await res.json();
      console.log('Order response:', data);
      
      if (!res.ok) {
        console.error('Order error details:', data);
        // Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const errorMsg = data.errors.map(e => `${e.param || e.path}: ${e.msg}`).join('\n');
          alert('Validation errors:\n' + errorMsg);
        } else {
          alert(data.error || data.message || 'Failed to place order');
        }
        return;
      }
      
      if (data.success) {
        alert('Order placed successfully!');
        clearCart();
      } else {
        alert(data.error || data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error: ' + err.message);
    }
  };

  if (!user) return <div className="text-center mt-10 text-lg">Please login to view your cart.</div>;
  if (!cartItems || cartItems.length === 0) {
    return <div className="text-center mt-10 text-lg">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Cart</h2>
      <ul className="divide-y divide-gray-200">
        {cartItems.map(item => (
          <li key={item.product_id} className="flex items-center py-4">
            <img
              src={item.image_url || 'https://via.placeholder.com/80'}
              alt={item.name}
              className="w-20 h-20 object-cover rounded mr-4 border"
            />
            <div className="flex-1">
              <div className="font-semibold text-lg">{item.name}</div>
              <div className="text-gray-500 text-sm mb-1">Category: {item.category}</div>
              <div className="text-gray-700">₹{item.price}</div>
              <div className="flex items-center mt-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded-l"
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >-</button>
                <span className="px-3">{item.quantity}</span>
                <button
                  className="px-2 py-1 bg-gray-200 rounded-r"
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >+</button>
              </div>
            </div>
            <div className="flex flex-col items-end ml-4">
              <div className="font-bold text-primary mb-2">₹{item.price * item.quantity}</div>
              <button
                className="text-red-500 text-sm underline"
                onClick={() => removeFromCart(item.product_id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 text-right text-xl font-bold">
        Total: <span className="text-primary">₹{getCartTotal()}</span>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Delivery Address</h3>
        <input className="border p-2 mb-2 w-full" placeholder="Street" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
        <input className="border p-2 mb-2 w-full" placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
        <input className="border p-2 mb-2 w-full" placeholder="State" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
        <input className="border p-2 mb-2 w-full" placeholder="Postal Code" value={address.postal_code} onChange={e => setAddress({ ...address, postal_code: e.target.value })} />
        <input className="border p-2 mb-2 w-full" placeholder="Country" value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} />
        <textarea className="border p-2 mb-2 w-full" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary/80"
          onClick={handleBuy}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default Cart;