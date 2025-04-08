'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { clientService } from '@/services/clients';
import { paymentService } from '@/services/payments';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPayments: 0,
    recentPayments: [],
  });
  const [clientsData, setClientsData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const clientsData = await clientService.getAll();
        setClientsData(clientsData);
        // Calculate total payments and get recent payments
        let totalPayments = 0;
        let recentPayments = [];

        for (const client of clientsData) {
          const paymentsData = await paymentService.getAllPayments();

          totalPayments += paymentsData.length;
          recentPayments = [...recentPayments, ...paymentsData.map(p => ({ ...p, clientName: client.name }))]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        }

        setStats({
          totalClients: clientsData.length,
          totalPayments,
          recentPayments,
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }
  console.log(clientsData.length);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening with your clients</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{clientsData?.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/clients" className="font-medium text-blue-600 hover:text-blue-500">
                View all clients
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalPayments}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/payments" className="font-medium text-blue-600 hover:text-blue-500">
                View all payments
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Payments</h3>
          <p className="text-center text-sm text-gray-600">
            It&apos;s time to start your journey!
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {stats.recentPayments.map((payment) => (
                <li key={payment.id} className="py-4 px-4 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {payment.clientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.month} {payment.year}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${payment.enteredAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}