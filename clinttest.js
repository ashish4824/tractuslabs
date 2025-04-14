'use client';
import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { clientService } from '@/services/clients';
import { paymentService } from '@/services/payments';
import { Edit, MoveLeft, MoveRight, Trash } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip'
export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [monthFillter, setMonthFillter] = useState(false);
  const [update, setUpdate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    fixedAmount: '',
  });
  const [payments, setPayments] = useState({
    enteredAmount: {},
    messages: {},
    dates: {},
    month: '',
    year: '',
  })
  // Add a ref to store timers for debouncing
  const paymentTimers = useRef({})
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

  const handleEdit = async (client) => {
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
  // console.log(payments);

  const handlePaymentUpdate = async (clientId) => {
    try {
      const client = clients.find(c => c._id === clientId);
      if (!client) throw new Error('Client not found');

      const currentMonthAmount = payments.enteredAmount[clientId]?.[payments.month];
      const currentMessage = payments.messages[clientId]?.[payments.month] || '';
      const currentDate = payments.dates[clientId]?.[payments.month] || new Date().toISOString();

      const paymentData = {
        payments: months.map(month => ({
          year: currentYear,
          month,
          enteredAmount: month === payments.month ? Number(currentMonthAmount || Number(client.payments?.[currentYear]?.[month]?.amount || 0)) : Number(client.payments?.[currentYear]?.[month]?.amount || 0),
          isPaid: month === payments.month ? Number(currentMonthAmount || 0) > 0 : Boolean(client.payments?.[currentYear]?.[month]?.amount > 0),
          balance: Number(client.fixedAmount),
          date: month === payments.month ? currentDate : (client.payments?.[currentYear]?.[month]?.date || new Date().toISOString()),
          messages: month === payments.month ? currentMessage : (client.payments?.[currentYear]?.[month]?.messages?.text || '')

        }))
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

      setPayments(prev => ({
        ...prev,
        enteredAmount: {
          ...prev.enteredAmount,
          [clientId]: {}
        },
        month: '',
        year: currentYear
      }));
    } catch (err) {
      setError(err.message || 'Failed to update payment');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // Add this state
  const filteredClients = clients.filter(client => {
    const nameMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = client.phone && client.phone.toString().includes(searchTerm);
    const amountMatch = client.fixedAmount && client.fixedAmount.toString().toLowerCase().includes(searchTerm.toLowerCase());

    // Add payment status filtering
    let paymentStatusMatch = true;
    if (paymentStatusFilter !== 'all') {
      const isPaid = paymentStatusFilter === 'paid';
      const hasPaymentForMonth = selectedMonths.length > 0
        ? selectedMonths.some(month => {
          const payment = client.payments?.[currentYear]?.[month];
          return isPaid ? (payment?.amount > 0) : (payment?.amount <= 0);
        })
        : months.some(month => {
          const payment = client.payments?.[currentYear]?.[month];
          return isPaid ? (payment?.amount > 0) : (payment?.amount <= 0);
        });
      paymentStatusMatch = hasPaymentForMonth;
    }

    return (nameMatch || phoneMatch || amountMatch) && paymentStatusMatch;
  });
  // Pagination logic
  const indexOfLastClient = currentPage * itemsPerPage;
  const indexOfFirstClient = indexOfLastClient - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
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
        <div>
          <button className="text-2xl font-semibold text-gray-900">Clients</button>
          <div className="flex items-center space-x-2 text-black">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}>
              <MoveLeft />
            </button>
            <p>{currentYear}</p>
            <button onClick={() => setCurrentYear(currentYear + 1)}>
              <MoveRight />
            </button>
          </div>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black focus:ring-indigo-500"
            />
            <div className='relative'>
              <button className='w-full sm:w-auto bg-blue-500 p-2 rounded-md text-white' onClick={() => setMonthFillter(true)}>Month Filter</button>
              {monthFillter && (
                <div className=" absolute w-80 top-10 left-0 right-0 m-auto  z-10">
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
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black focus:ring-indigo-500"
                    >
                      <option value="all">All Payments</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
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
              onClick={() => {
                setShowAddModal(true), setFormData(
                  {
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    fixedAmount: '',
                  }
                )
              }}
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
                        <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month.slice(0, 3)}</th>
                      ))
                    ) : (
                      months.map(month => (
                        <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month.slice(0, 3)}</th>
                      ))
                    )}

                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Save</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >Action </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentClients.map(client => (
                    <tr key={client._id}>
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dropdown">
                      <button className='dropdown-button'>
                        {client.name}
                        </button>

                        <div className='space-x-2.5 top-10 left-0 right-0 m-auto dropdown-content w-fit'>
                        <button className='bg-red-500 text-white p-2 rounded-md  cursor-pointer' onClick={()=>handleDelete(client._id)}><Trash/></button>
                        <button className='bg-blue-500 text-white p-2 rounded-md cursor-pointer' onClick={()=>handleEdit(client)}><Edit/></button>
                        </div>
                        
                        </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">₹{Number(client.fixedAmount || 0).toFixed(2)}</td>
                      {selectedMonths.length > 0 ? (
                        selectedMonths.map(month => {
                          const payment = client.payments?.[currentYear]?.[month] || {};
                          return (
                            <td key={month} className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">

                              <div className={`flex flex-col items-center p-1 rounded-md ${payment.isPaid ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                <input
                                  type="number"
                                  value={payments.enteredAmount[client._id]?.[month] || payment.amount || ''}
                                  placeholder='Enter Amount...'
                                  onChange={(e) => {
                                    setPayments(prev => ({
                                      ...prev,
                                      enteredAmount: {
                                        ...prev.enteredAmount,
                                        [client._id]: {
                                          ...(prev.enteredAmount[client._id] || {}),
                                          [month]: e.target.value || payment.amount || 0
                                        }
                                      },
                                      month: month,
                                      year: currentYear
                                    }));
                                    // Add a small delay before saving to prevent too many API calls
                                    const timer = setTimeout(() => {
                                      handlePaymentUpdate(client._id);
                                    }, 2000);
                                    return () => clearTimeout(timer);
                                  }}
                                  className="w-full p-2 text-center border border-gray-300 rounded text-black"
                                />
                                <Dropdown label={"Open"} data={payment} id={client._id} submit={handlePaymentUpdate} >

                                  <input
                                    type='text'
                                    placeholder='enter you messages'
                                    className='w-full px-2 py-2 border border-gray-300 rounded text-black'
                                    value={payments.messages[client._id]?.[month] || payment.messages || ''}
                                    onChange={(e) => {
                                      setPayments(prev => ({
                                        ...prev,
                                        messages: {
                                          ...prev.messages,
                                          [client._id]: {
                                            ...(prev.messages[client._id] || ""),
                                            [month]: e.target.value
                                          }
                                        },
                                        month: month
                                      }));
                                      
                                      // Clear any existing timer for this client and month
                                      const timerKey = `${client._id}-${month}-msg`;
                                      if (paymentTimers.current[timerKey]) {
                                        clearTimeout(paymentTimers.current[timerKey]);
                                      }
                                      
                                      // Set a new timer and store it in the ref
                                      paymentTimers.current[timerKey] = setTimeout(() => {
                                        handlePaymentUpdate(client._id);
                                      }, 1000);
                                    }}
                                  />
                                  <input
                                    type='date'
                                    value={payments.dates[client._id]?.[month] || payment.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                      setPayments(prev => ({
                                        ...prev,
                                        dates: {
                                          ...prev.dates,
                                          [client._id]: {
                                            ...(prev.dates[client._id] || {}),
                                            [month]: e.target.value
                                          }
                                        },
                                        month: month
                                      }));
                                      
                                      // Clear any existing timer for this client and month
                                      const timerKey = `${client._id}-${month}-date`;
                                      if (paymentTimers.current[timerKey]) {
                                        clearTimeout(paymentTimers.current[timerKey]);
                                      }
                                      
                                      // Set a new timer and store it in the ref
                                      paymentTimers.current[timerKey] = setTimeout(() => {
                                        handlePaymentUpdate(client._id);
                                      }, 1000);
                                    }}
                                    className="w-full px-2 py-2 border border-gray-300 rounded text-black"
                                  />
                                </Dropdown>
                                {/* Save button removed - saving happens automatically on change */}
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
                              <Tooltip id={client._id} />
                              <a
                                data-tooltip-id={client._id}
                                data-tooltip-content={payment.messages?.text||''}
                                data-tooltip-place="top"
                              >
                                <div className={`flex flex-col  items-center p-1 rounded-md ${payment.isPaid ? 'bg-green-600 text-white ' : 'bg-red-600 text-white'}`}>
                                  <div className='flex w-full flex-col'>
                                    {/* {console.log( client )} */}
                                    <input
                                      type="number"
                                      value={payments.enteredAmount[client._id]?.[month] || payment.amount || ''}
                                      placeholder='enter amount...'
                                      onChange={(e) => {
                                        setPayments(prev => ({
                                          ...prev,
                                          enteredAmount: {
                                            ...prev.enteredAmount,
                                            [client._id]: {
                                              ...(prev.enteredAmount[client._id] || {}),
                                              [month]: e.target.value || payment.amount || 0
                                            }
                                          },
                                          month: month,
                                          year: currentYear
                                        }));
                                        
                                        // Clear any existing timer for this client and month
                                        const timerKey = `${client._id}-${month}`;
                                        if (paymentTimers.current[timerKey]) {
                                          clearTimeout(paymentTimers.current[timerKey]);
                                        }
                                        
                                        // Set a new timer and store it in the ref
                                        paymentTimers.current[timerKey] = setTimeout(() => {
                                          handlePaymentUpdate(client._id);
                                        }, 1000);
                                      }}
                                      className="w-full p-2 text-center border border-gray-300 rounded text-black"
                                    />
                                    <Dropdown label={"Open"} data={payment} id={client._id} submit={handlePaymentUpdate} >

                                      <input
                                        type='text'
                                        placeholder='enter you messages'
                                        value={payments.messages[client._id]?.[month] || payment.messages?.[0]?.text || ''}
                                        onChange={(e) => {
                                          setPayments(prev => ({
                                            ...prev,
                                            messages: {
                                              ...prev.messages,
                                              [client._id]: {
                                                ...(prev.messages[client._id] || ''),
                                                [month]: e.target.value
                                              }
                                            },
                                            month: month
                                          }));
                                          
                                          // Clear any existing timer for this client and month
                                          const timerKey = `${client._id}-${month}-msg`;
                                          if (paymentTimers.current[timerKey]) {
                                            clearTimeout(paymentTimers.current[timerKey]);
                                          }
                                          
                                          // Set a new timer and store it in the ref
                                          paymentTimers.current[timerKey] = setTimeout(() => {
                                            handlePaymentUpdate(client._id);
                                          }, 1000);
                                        }}
                                        className="w-full px-2 py-2 border border-gray-300 rounded text-black"
                                      />
                                      <input
                                        type='date'
                                        value={payments.dates[client._id]?.[month] || payment.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                          setPayments(prev => ({
                                            ...prev,
                                            dates: {
                                              ...prev.dates,
                                              [client._id]: {
                                                ...(prev.dates[client._id] || {}),
                                                [month]: e.target.value
                                              }
                                            },
                                            month: month
                                          }));
                                          
                                          // Clear any existing timer for this client and month
                                          const timerKey = `${client._id}-${month}-date`;
                                          if (paymentTimers.current[timerKey]) {
                                            clearTimeout(paymentTimers.current[timerKey]);
                                          }
                                          
                                          // Set a new timer and store it in the ref
                                          paymentTimers.current[timerKey] = setTimeout(() => {
                                            handlePaymentUpdate(client._id);
                                          }, 1000);
                                        }}
                                        className="w-full px-2 py-2 border border-gray-300 rounded text-black"
                                      />
                                    </Dropdown>
                                  </div>
                                  {/* Save button removed - saving happens automatically on change */}
                                  <span className="text-xs text-white mt-2.5">Bal: {payment.balance}</span>
                                </div>
                              </a>
                            </td>
                          );
                        })
                      )}
                      {/* <td><button className='bg-blue-500 text-white p-2 rounded-md' onClick={()=>handleEdit(client)}><Edit/></button> </td> */}
                      {/* <td><button className='bg-red-500 text-white p-2 rounded-md' onClick={()=>handlePaymentUpdate(client._id)}>save</button> </td> */}
                      {/* <td><button className='bg-red-500 text-white p-2 rounded-md' onClick={()=>handleDelete(client._id)}><Trash/></button> </td> */}
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
        <div className="flex flex-col space-y-4 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
              <Button
                onClick={prevPage}
                disabled={currentPage === 1}
                variant="secondary"
                size="small"
                className="text-sm px-3 py-1"
              >
                Previous
              </Button>

              <div className="flex flex-wrap justify-center gap-1 max-w-[280px] sm:max-w-none overflow-x-auto px-1">
                {totalPages <= 5 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`min-w-[32px] h-8 text-sm rounded ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {number}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => paginate(1)}
                      className={`min-w-[32px] h-8 text-sm rounded ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      1
                    </button>

                    {currentPage > 3 && <span className="px-1 text-gray-500">...</span>}

                    {Array.from(
                      { length: Math.min(3, totalPages - 2) },
                      (_, i) => {
                        let pageNum;
                        if (currentPage <= 3) {
                          pageNum = i + 2;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 3 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }

                        return pageNum > 1 && pageNum < totalPages ? (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`min-w-[32px] h-8 text-sm rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            {pageNum}
                          </button>
                        ) : null;
                      }
                    ).filter(Boolean)}

                    {currentPage < totalPages - 2 && <span className="px-1 text-gray-500">...</span>}

                    <button
                      onClick={() => paginate(totalPages)}
                      className={`min-w-[32px] h-8 text-sm rounded ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
                className="text-sm px-3 py-1"
              >
                Next
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Page {currentPage} of {totalPages || 1} | Showing {indexOfFirstClient + 1}-{Math.min(indexOfLastClient, filteredClients.length)} of {filteredClients.length} clients
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">Items per page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-black min-w-[60px]"
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
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
  )
}
