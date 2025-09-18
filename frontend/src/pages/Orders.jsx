import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaPlus, FaEye, FaEdit, FaCheck, FaTimes, FaClipboardList, FaClock, FaUtensils } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

function Orders() {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOrderType, setSelectedOrderType] = useState('ALL');
  const [viewingOrder, setViewingOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery(['orders'], async () => {
    const response = await api.get('/api/orders');
    return Array.isArray(response.data) ? response.data : [];
  });

  const updateStatusMutation = useMutation(
    ({ id, status }) => api.put(`/api/orders/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
      }
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'SERVED': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case 'DINE_IN': return 'bg-blue-100 text-blue-800';
      case 'TAKEAWAY': return 'bg-green-100 text-green-800';
      case 'DELIVERY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = selectedStatus === 'ALL' || order.status === selectedStatus;
    const typeMatch = selectedOrderType === 'ALL' || order.orderType === selectedOrderType;
    return statusMatch && typeMatch;
  });

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
        <div className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={selectedOrderType}
            onChange={(e) => setSelectedOrderType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Types</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(order.orderType)}`}>
                  {order.orderType.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {order.table && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">Table {order.table.tableNumber}</span>
                </div>
              )}
              
              {order.customer && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
              )}
              
              {order.waiterName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Waiter:</span>
                  <span className="font-medium">{order.waiterName}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-primary-600">
                  {formatCurrency(order.finalAmount)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {order.notes && (
              <div className="mb-4 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setViewingOrder(order)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
              >
                <FaEye /> View
              </button>
            </div>

            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <div className="flex gap-1 flex-wrap">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                  >
                    <FaCheck /> Confirm
                  </button>
                )}
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                    className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 flex items-center gap-1"
                  >
                    <FaUtensils /> Prepare
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'READY')}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 flex items-center gap-1"
                  >
                    <FaCheck /> Ready
                  </button>
                )}
                {order.status === 'READY' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                    className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 flex items-center gap-1"
                  >
                    <FaCheck /> Served
                  </button>
                )}
                {order.status === 'SERVED' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                    className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                  >
                    <FaCheck /> Complete
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 flex items-center gap-1"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <FaClipboardList className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No orders found</h3>
          <p className="text-gray-400">Orders will appear here when customers place them</p>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order #{viewingOrder.orderNumber}</h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Order Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Status:</span> {viewingOrder.status}</p>
                  <p><span className="text-gray-600">Type:</span> {viewingOrder.orderType}</p>
                  <p><span className="text-gray-600">Date:</span> {new Date(viewingOrder.createdAt).toLocaleString()}</p>
                  {viewingOrder.table && <p><span className="text-gray-600">Table:</span> {viewingOrder.table.tableNumber}</p>}
                  {viewingOrder.waiterName && <p><span className="text-gray-600">Waiter:</span> {viewingOrder.waiterName}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Subtotal:</span> {formatCurrency(viewingOrder.totalAmount)}</p>
                  <p><span className="text-gray-600">Discount:</span> {formatCurrency(viewingOrder.discountAmount)}</p>
                  <p><span className="text-gray-600">Tax:</span> {formatCurrency(viewingOrder.taxAmount)}</p>
                  <p className="font-semibold"><span className="text-gray-600">Total:</span> {formatCurrency(viewingOrder.finalAmount)}</p>
                  <p><span className="text-gray-600">Payment Status:</span> {viewingOrder.paymentStatus}</p>
                  {viewingOrder.paymentMethod && <p><span className="text-gray-600">Payment Method:</span> {viewingOrder.paymentMethod}</p>}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <div className="space-y-2">
                {viewingOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.specialInstructions && (
                        <p className="text-xs text-blue-600">Note: {item.specialInstructions}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {viewingOrder.notes && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-700 p-2 bg-yellow-50 rounded">{viewingOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;