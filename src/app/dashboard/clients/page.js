'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { clientService } from '@/services/clients';
import { paymentService } from '@/services/payments';
import { Edit, Trash } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const[monthFillter,setMonthFillter] = useState(false);
  const [update, setUpdate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    fixedAmount: '',
  });
  const [payments, setPayments] = useState({
    enteredAmount:'',
    month: '',
    year: '',
  })
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [1, 10, 25, 50];

  const fetchClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await clientService.createClient(formData);  // Changed from create to createClient
      setClients([...clients, data.client]);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        fixedAmount: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to add client');
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setError('Please select a valid CSV file');
      setCsvFile(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first');
      return;
    }

    setUploadLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // Parse CSV data
        const clients = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue;
          
          const values = lines[i].split(',');
          const client = {};
          
          headers.forEach((header, index) => {
            client[header.trim()] = values[index]?.trim() || '';
          });
          
          clients.push(client);
        }

        // Upload parsed clients
        await clientService.uploadCSV(clients);
        await fetchClients(); // Refresh client list
        setCsvFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(csvFile);
    } catch (err) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      await clientService.deleteClient(clientId);  // Changed from delete to deleteClient
      setClients(clients.filter(client => client._id !== clientId));
      
      // Reset to first page if we're on the last page and it's now empty
      const newFilteredClients = clients.filter(client => client._id !== clientId)
        .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const newTotalPages = Math.ceil(newFilteredClients.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    }
  };

const handleEdit = async(client) => {
  setShowAddModal(true);
  setUpdate(true);
  setFormData(client);
};
// First, fix the handleUpdate function
const handleUpdate = async (clientId) => {
  try {
    await clientService.updateClient(clientId, formData);
    setClients(clients.map(client => 
      client._id === clientId ? { ...client, ...formData } : client
    ));
    setShowAddModal(false);
    setUpdate(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      fixedAmount: '',
    });
  } catch (err) {
    setError(err.message || 'Failed to update client');
  }
};
console.log(payments);
  
const handlePaymentUpdate = async (clientId) => {
  try {
    const client = clients.find(c => c._id === clientId);
    if (!client) throw new Error('Client not found');
    if (!payments.month || !payments.enteredAmount) {
      setError('Please select a month and enter an amount');
      return;
    }

    const paymentData = {
      payments: months.map(month => {
        const existingPayment = client.payments?.[currentYear]?.[month] || {};
        const isCurrentMonth = month === payments.month;
        const amount = isCurrentMonth ? Number(payments.enteredAmount) : Number(existingPayment.amount || 0);
        const isPaid = true;
        const fixedAmount = Number(client.fixedAmount || 0);
        const balance = fixedAmount - amount;

        return {
          year: currentYear,
          month,
          enteredAmount: amount,
          isPaid,
          balance
        };
      })
    };

    const response = await fetch(`https://client-app-blush.vercel.app/payments/${clientId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update payment');
    }

    const updatedClients = await clientService.getAll();
    setClients(updatedClients);
    
    setPayments({
      enteredAmount: '',
      month: '',
      year: currentYear
    });
  } catch (err) {
    setError(err.message || 'Failed to update payment');
  }
};

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Modify the filteredClients to consider the selected month
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.toString().includes(searchTerm)) ||
    (client.fixedAmount && client.fixedAmount.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );
  // Pagination logic
  const indexOfLastClient = currentPage * itemsPerPage;
  const indexOfFirstClient = indexOfLastClient - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <button  className="text-2xl font-semibold text-gray-900">Clients</button>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black focus:ring-indigo-500"
            />
            <button className='w-full sm:w-auto bg-blue-500 p-2 rounded-md text-white' onClick={()=>setMonthFillter(true)}>Month Filter</button>
            {monthFillter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg max-h-[90vh] overflow-y-auto mx-4">
            <h2 className="text-lg font-bold mb-4 text-center text-black">Select Months</h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {months.map((month) => (
                <div key={month} className="flex items-center">
                  <input
                    type="checkbox"
                    value={month}
                    id={month}
                    checked={selectedMonths.includes(month)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMonths([...selectedMonths, month]);
                      } else {
                        setSelectedMonths(selectedMonths.filter(m => m !== month));
                      }
                    }}
                    className="mr-2 size-8 rounded-xl"
                  />
                  <label htmlFor={month} className="text-black cursor-pointer">{month}</label>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setMonthFillter(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="hidden"
              id="csv-file-input"
              ref={fileInputRef}
            />
            <label
              htmlFor="csv-file-input"
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors text-center"
            >
              {csvFile ? csvFile.name : 'Choose CSV'}
            </label>
            <Button 
              onClick={handleCsvUpload} 
              variant="secondary"
              isLoading={uploadLoading}
              disabled={!csvFile || uploadLoading}
              className="w-full sm:w-auto"
            >
              Upload CSV
            </Button>
            <Button 
              onClick={() => {setShowAddModal(true),setFormData(
                {
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  fixedAmount: '',
                }
              )}} 
              className="w-full sm:w-auto"
            >
              Add Client
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fixed Amount</th>
                    {selectedMonths.length > 0 ? (
                      selectedMonths.map(month => (
                        <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month}</th>
                      ))
                    ) : (
                      months.map(month => (
                        <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month}</th>
                      ))
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentClients.map(client => (
                    <tr key={client._id}>
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">₹{Number(client.fixedAmount || 0).toFixed(2)}</td>
                      {selectedMonths.length > 0 ? (
                        selectedMonths.map(month => {
                          const payment = client.payments?.[currentYear]?.[month] || {};
                          return (
                            <td key={month} className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className={`flex flex-col items-center p-1 rounded-md ${payment.amount>0 ? 'bg-green-600 text-white ' : 'bg-red-600 text-white'}`}>
                                <input
                                  type="number"
                                  value={payments.enteredAmount|| payment.amount || 0}
                                  onChange={(e) => setPayments({
                                    enteredAmount: e.target.value,
                                    month: month,
                                    year: currentYear
                                  })}
                                  className="w-16 text-center border border-gray-300 rounded text-black"
                                />
                                <span className={`text-xs ${payment.isPaid ? 'text-red-500' : 'text-green-600'}`}>
                                  {payment.isPaid ? '✔' : '✘'}
                                </span>
                                <span className="text-xs text-white">Bal: {payment.balance || 0}</span>
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        months.map(month => {
                          const payment = client.payments?.[currentYear]?.[month] || {};
                          return (
                            <td key={month} className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className={`flex flex-col items-center p-1 rounded-md ${payment.isPaid ? 'bg-green-600 text-white ' : 'bg-red-600 text-white'}`}>
                                <input
                                  type="number"
                                  value={payments.enteredAmount|| payment.amount || 0}
                                  onChange={(e) => setPayments({
                                    enteredAmount: e.target.value,
                                    month: month,
                                    year: currentYear
                                  })}
                                  className="w-16 text-center border border-gray-300 rounded text-black"
                                />
                                <span className={`text-xs ${payment.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                  {payment.isPaid ? '✔' : '✘'}
                                </span>
                                <span className="text-xs text-white">Bal: {payment.balance || 0}</span>
                              </div>
                            </td>
                          );
                        })
                      )}
                      <td><button className='bg-blue-500 text-white p-2 rounded-md' onClick={()=>handleEdit(client)}><Edit/></button> </td>
                      <td><button className='bg-red-500 text-white p-2 rounded-md' onClick={()=>handlePaymentUpdate(client._id)}>save</button> </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredClients.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-2 mt-4 pb-6">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={prevPage} 
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {totalPages <= 7 ? (
                // Show all page numbers if there are 7 or fewer
                Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 rounded ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {number}
                  </button>
                ))
              ) : (
                // Show limited page numbers with ellipsis for many pages
                <>
                  {/* First page */}
                  <button
                    onClick={() => paginate(1)}
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    1
                  </button>
                  
                  {/* Ellipsis or number */}
                  {currentPage > 3 && <span className="px-2">...</span>}
                  
                  {/* Pages around current page */}
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (currentPage <= 3) {
                        // Near the start
                        pageNum = i + 2;
                      } else if (currentPage >= totalPages - 2) {
                        // Near the end
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Middle
                        pageNum = currentPage - 2 + i;
                      }
                      
                      // Only show if in valid range (2 to totalPages-1)
                      return pageNum > 1 && pageNum < totalPages ? (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    }
                  ).filter(Boolean)}
                  
                  {/* Ellipsis or number */}
                  {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                  
                  {/* Last page */}
                  <button
                    onClick={() => paginate(totalPages)}
                    className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <Button 
              onClick={nextPage} 
              disabled={currentPage === totalPages}
              variant="secondary"
              size="small"
            >
              Next
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages || 1} | Showing {indexOfFirstClient + 1}-{Math.min(indexOfLastClient, filteredClients.length)} of {filteredClients.length} clients
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">Items per page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4 text-black font-bold">Add New Client</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Client name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="fixedAmount" className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₹)</label>
                <input
                  id="fixedAmount"
                  name="fixedAmount"
                  type="number"
                  step="0.01"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="0.00"
                  value={formData.fixedAmount}
                  onChange={(e) => setFormData({...formData, fixedAmount: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                {update ? (
                  <Button onClick={() => handleUpdate(formData._id)} type="button" variant="primary">Update</Button>
                ) : (
                  <Button onClick={handleSubmit} type="submit" variant="primary">Add Client</Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )}
