import { FaSearch, FaTh, FaList } from 'react-icons/fa';

export function POSHeader({
  showSearchInputs,
  setShowSearchInputs,
  viewMode,
  setViewMode
}) {
  return (
    <div className="bg-white shadow-sm p-2 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">Point of Sale</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newValue = !showSearchInputs;
              setShowSearchInputs(newValue);
              localStorage.setItem('posShowSearchInputs', JSON.stringify(newValue));
            }}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              showSearchInputs
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle Search Inputs"
          >
            <FaSearch className="inline mr-1" />
            Search
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('default')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'default'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaTh className="inline mr-1" />
              Default
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'compact'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaList className="inline mr-1" />
              Compact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
