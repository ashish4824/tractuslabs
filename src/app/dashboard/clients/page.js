'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { clientService } from '@/services/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [update, setUpdate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    fixedAmount: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

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
      setClients(clients.filter(client => client.id !== clientId));
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Add this function to filter clients
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black focus:ring-indigo-500"
          />
          <div className="flex items-center gap-2">
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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors"
            >
              {csvFile ? csvFile.name : 'Choose CSV'}
            </label>
            <Button 
              onClick={handleCsvUpload} 
              // className='bg-blue-500 text-black p-2 rounded-md'
              variant="secondary"
              isLoading={uploadLoading}
              disabled={!csvFile || uploadLoading}
            >
              Upload CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)}>Add Client</Button>
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
                    {months.map(month => (
                      <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month}</th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map(client => (  // Changed from clients to filteredClients
                    <tr key={client._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{Number(client.fixedAmount || 0).toFixed(2)}</td>
                      {months.map(month => {
                        const payment = client.payments?.['2025']?.[month] || {};
                        return (
                          
                          <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col items-center">
                              <input
                                type="text"
                                value={payment.amount || 0}
                                className="w-16 text-center border border-gray-300 rounded"
                                readOnly
                              />
                              <span className={`text-xs ${payment.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                {payment.isPaid ? '✔' : '✘'}
                              </span>
                              <span className="text-xs text-gray-500">Bal: {payment.balance || 0}</span>
                            </div>
                          </td>
                          
                          
                        );
                      })}
                      <td><button className='bg-blue-500 text-white p-2 rounded-md' onClick={()=>handleEdit(client)}>Edit</button> </td>
                      <td><button className='bg-red-500 text-white p-2 rounded-md' onClick={()=>handleDelete(client._id)}>Delete</button> </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
  );
}
