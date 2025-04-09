'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { clientService, paymentService } from '@/services/clients';
import DateFormate from '@/components/DateFormate';

export default function PaymentsPage() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    enteredAmount: '',
    month: '',
    year: new Date().getFullYear(),
    message:'',
    isPaid:true
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll();      
      setClients(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch clients');
    }
  };

  // Update the fetchPayments function
  const fetchPayments = async (clientId) => {
    try {
      const data = await paymentService.getAllByClient(clientId);
      setPayments(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };
  
  // Update handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await paymentService.createPayment(selectedClient, formData);
      setShowAddModal(false);
      setPayments([...payments, data.payment]);
      setFormData({
        enteredAmount: '',
        month: '',
        year: new Date().getFullYear(),
        message:'',
        isPaid:''
      });
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to add payment');
    }
  };
  
  // Update handleDelete
  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
  
    try {
      await paymentService.deletePayment(paymentId);
      setPayments(payments.filter(payment => payment.id !== paymentId));
    } catch (err) {
      setError(err.message || 'Failed to delete payment');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchPayments(selectedClient);
    }
  }, [selectedClient]);


  if (loading && selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        {selectedClient && (
          <Button onClick={() => setShowAddModal(true)}>Add Payment</Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-gray-700">Select Client</label>
        <select
          className="mt-1 block w-full p-2 border-[1px] text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month/Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span className='line-clamp-1'> Message</span> 
                      </th>
                      <th scope="col" className="relative px-6 py-3 text-black">
                        <span className="text-gray-500">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments?.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.month} {payment.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                          ₹{Number(payment.enteredAmount.toFixed(2))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {DateFormate(payment.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(payment._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4 text-black">Add New Payment</h2>
            <form  className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="mt-1 block w-full p-2 border-[1px] text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.enteredAmount}
                  onChange={(e) => setFormData({ ...formData, enteredAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <select
                  required
                  className="mt-1 block w-full p-3 border-[1px] text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                >
                  <option value="">Select month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full p-2 border-[1px] text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">message</label>
                <textarea
                  type="text"
                  rows={3}
                  placeholder="Enter a message"
                  required
                  className="mt-1 block w-full p-2 border-[1px] text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit}  variant="primary">
                  Add Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}