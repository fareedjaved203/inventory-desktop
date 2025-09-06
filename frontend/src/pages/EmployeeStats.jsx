import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatPakistaniCurrency } from "../utils/formatCurrency";

function EmployeeStats() {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);
  
  // Get current employee ID from localStorage (set during login)
  const employeeId = localStorage.getItem('employeeId');
  const employeeName = localStorage.getItem('employeeName') || 'Employee';

  const { data: stats, isLoading } = useQuery(
    ['employee-stats', employeeId, period, startDate, endDate],
    async () => {
      if (!employeeId) return null;
      
      const params = new URLSearchParams();
      if (useCustomDates && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/employee-stats/${employeeId}?${params}`
      );
      return response.data;
    },
    {
      enabled: !!employeeId
    }
  );

  if (!employeeId) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-yellow-800 font-medium">Access Restricted</h3>
          <p className="text-yellow-600 text-sm mt-1">
            This page is only available for employee accounts.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPeriodLabel = () => {
    if (useCustomDates && startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    switch (period) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '365days': return 'Last 365 Days';
      default: return period;
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-800">Employee Stats</h1>
          <p className="text-gray-600 mt-1">Welcome, {employeeName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useCustomDates}
                onChange={(e) => setUseCustomDates(e.target.checked)}
                className="mr-2"
              />
              Custom Dates
            </label>
          </div>
          
          {useCustomDates ? (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          ) : (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="365days">Last 365 Days</option>
            </select>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Sales Summary - {getPeriodLabel()}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sales</p>
              <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
            </div>
            <div className="text-3xl opacity-80">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Amount</p>
              <p className="text-2xl font-bold">{formatPakistaniCurrency(stats?.totalAmount || 0)}</p>
            </div>
            <div className="text-3xl opacity-80">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Items Sold</p>
              <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
            </div>
            <div className="text-3xl opacity-80">📦</div>
          </div>
        </div>
      </div>

      {stats?.sales && stats.sales.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      #{sale.billNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {sale.items.reduce((sum, item) => sum + Number(item.quantity), 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {formatPakistaniCurrency(sale.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!stats?.sales || stats.sales.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
          <p className="text-gray-500">No sales data available for the selected period.</p>
        </div>
      )}
    </div>
  );
}

export default EmployeeStats;