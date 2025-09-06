import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function BranchEmployeeSalesChart() {
  const [period, setPeriod] = useState('30days');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const { data: branchData, isLoading } = useQuery(
    ['branch-employee-sales', period],
    async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/branch-employee-sales?period=${period}`
      );
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!branchData || branchData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Branch-wise Employee Sales</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No employee sales data available</p>
        </div>
      </div>
    );
  }

  // Filter branches based on selection
  const filteredBranchData = selectedBranch === 'all' 
    ? branchData 
    : branchData.filter(branch => branch.branchName === selectedBranch);

  // Prepare data for the chart
  let allEmployees = [];
  let datasets = [];
  
  const branchColors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
  ];

  if (selectedBranch === 'all') {
    // Show all branches with grouped employees
    filteredBranchData.forEach(branch => {
      branch.employees.forEach(emp => {
        if (!allEmployees.includes(emp.name)) {
          allEmployees.push(emp.name);
        }
      });
    });

    datasets = filteredBranchData.map((branch, branchIndex) => ({
      label: branch.branchName,
      data: allEmployees.map(empName => {
        const employee = branch.employees.find(emp => emp.name === empName);
        return employee ? employee.sales : 0;
      }),
      backgroundColor: branchColors[branchIndex % branchColors.length],
      borderColor: branchColors[branchIndex % branchColors.length].replace('0.8', '1'),
      borderWidth: 1,
    }));
  } else {
    // Show only employees from selected branch
    const selectedBranchData = filteredBranchData[0];
    if (selectedBranchData) {
      allEmployees = selectedBranchData.employees.map(emp => emp.name);
      datasets = [{
        label: selectedBranchData.branchName,
        data: selectedBranchData.employees.map(emp => emp.sales),
        backgroundColor: branchColors[0],
        borderColor: branchColors[0].replace('0.8', '1'),
        borderWidth: 1,
      }];
    }
  }

  const chartData = {
    labels: allEmployees,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Employee Sales by Branch - ${period === 'today' ? 'Today' : period === '7days' ? 'Last 7 Days' : 'Last 30 Days'}`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatPakistaniCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatPakistaniCurrency(value);
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      default: return period;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Branch-wise Employee Sales</h3>
        <div className="flex gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Branches</option>
            {branchData.map(branch => (
              <option key={branch.branchName} value={branch.branchName}>
                {branch.branchName}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      <div className="h-96 w-full">
        <Bar data={chartData} options={options} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Showing sales performance for {getPeriodLabel().toLowerCase()}</p>
        <p>Each bar represents an employee's total sales amount</p>
      </div>
    </div>
  );
}

export default BranchEmployeeSalesChart;