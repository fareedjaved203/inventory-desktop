import { useState } from 'react';
import DayBookReportModal from '../components/DayBookReportModal';
import UrduDayBookReportModal from '../components/UrduDayBookReportModal';
import { FaBook } from 'react-icons/fa';

function Reports() {
  const [showDayBookModal, setShowDayBookModal] = useState(false);
  const [showUrduDayBookModal, setShowUrduDayBookModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowDayBookModal(true)}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-400"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <FaBook className="text-3xl text-purple-600" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-800">Day Book</h2>
              <p className="text-gray-600 text-sm">English daybook report</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowUrduDayBookModal(true)}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-indigo-200 hover:border-indigo-400"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-4 rounded-full">
              <FaBook className="text-3xl text-indigo-600" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-800 font-urdu">روزنامچہ (اردو)</h2>
              <p className="text-gray-600 text-sm">Urdu daybook report</p>
            </div>
          </div>
        </button>
      </div>

      <DayBookReportModal 
        isOpen={showDayBookModal} 
        onClose={() => setShowDayBookModal(false)} 
      />
      
      <UrduDayBookReportModal 
        isOpen={showUrduDayBookModal} 
        onClose={() => setShowUrduDayBookModal(false)} 
      />
    </div>
  );
}

export default Reports;
