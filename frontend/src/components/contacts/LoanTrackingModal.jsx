import { FaDollarSign, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function LoanTrackingModal({
  language,
  selectedContact,
  activeTab,
  setActiveTab,
  setLoanType,
  loanData,
  loanType,
  loanAmount,
  setLoanAmount,
  loanDescription,
  setLoanDescription,
  handleAddLoan,
  isCreatingLoan,
  deleteLoanTransactionMutate,
  isDeletingLoan,
  setShowLoanModal,
  setSelectedContact,
  setLoanTypeState,
  setLoanDescriptionState
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            {language === 'ur' ? 'قرض کی نگرانی' : 'Loan Tracking'} - {selectedContact.name}
          </h2>
          
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => {
                setActiveTab('given');
                setLoanType('GIVEN');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'given'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {language === 'ur' ? 'دیا گیا قرض' : 'Loan Given'}
            </button>
            <button
              onClick={() => {
                setActiveTab('taken');
                setLoanType('TAKEN');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'taken'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {language === 'ur' ? 'لیا گیا قرض' : 'Loan Taken'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {/* Money Given Tab */}
          {activeTab === 'given' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-700">Total Loan Given</h3>
                  <p className="text-2xl font-bold text-green-800">
                    {formatPakistaniCurrency(loanData?.totalGiven || 0)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-medium text-purple-700">Loan Returned by {selectedContact.name}</h3>
                  <p className="text-2xl font-bold text-purple-800">
                    {formatPakistaniCurrency(loanData?.totalReturnedByContact || 0)}
                  </p>
                </div>
              </div>
              
              {/* Outstanding Balance */}
              <div className={`p-4 rounded-lg border ${
                (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <h3 className={`text-sm font-medium ${
                  (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}>
                  {(loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                    ? `${selectedContact.name} has to pay you`
                    : `You have to pay ${selectedContact.name}`
                  }
                </h3>
                <p className={`text-xl font-bold ${
                  (loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0) >= 0
                    ? 'text-yellow-800'
                    : 'text-green-800'
                }`}>
                  {formatPakistaniCurrency(Math.abs((loanData?.totalGiven || 0) - (loanData?.totalReturnedByContact || 0)))}
                </p>
              </div>

              {/* Add Transaction */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium mb-4 text-green-800">Add Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={loanType}
                      onChange={(e) => setLoanTypeState ? setLoanTypeState(e.target.value) : setLoanType(e.target.value)}
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="GIVEN">Give Loan</option>
                      <option value="RETURNED_BY_CONTACT">Received Back</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={loanDescription}
                      onChange={(e) => setLoanDescriptionState ? setLoanDescriptionState(e.target.value) : setLoanDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="self-end">
                    <button
                      onClick={handleAddLoan}
                      disabled={isCreatingLoan}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingLoan && <LoadingSpinner size="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="font-medium mb-4 text-green-800">Transaction History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loanData?.transactions?.filter(t => t.type === 'GIVEN' || t.type === 'RETURNED_BY_CONTACT').map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {transaction.type === 'GIVEN' ? '💸 Loan Given' : '💰 Loan Received Back'}
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-gray-600">{transaction.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`font-bold ${
                          transaction.type === 'GIVEN' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {formatPakistaniCurrency(transaction.amount)}
                        </div>
                        <button
                          onClick={() => deleteLoanTransactionMutate(transaction.id)}
                          disabled={isDeletingLoan}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Money Taken Tab */}
          {activeTab === 'taken' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-700">Total Loan Taken</h3>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatPakistaniCurrency(loanData?.totalTaken || 0)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-medium text-orange-700">Loan Returned to {selectedContact.name}</h3>
                  <p className="text-2xl font-bold text-orange-800">
                    {formatPakistaniCurrency(loanData?.totalReturnedToContact || 0)}
                  </p>
                </div>
              </div>
              
              {/* Outstanding Debt */}
              <div className={`p-4 rounded-lg border ${
                (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <h3 className={`text-sm font-medium ${
                  (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                    ? 'text-red-700'
                    : 'text-blue-700'
                }`}>
                  {(loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                    ? `You have to pay ${selectedContact.name}`
                    : `${selectedContact.name} has to pay you`
                  }
                </h3>
                <p className={`text-xl font-bold ${
                  (loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0) >= 0
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {formatPakistaniCurrency(Math.abs((loanData?.totalTaken || 0) - (loanData?.totalReturnedToContact || 0)))}
                </p>
              </div>

              {/* Add Transaction */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-4 text-blue-800">Add Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={loanType}
                      onChange={(e) => setLoanTypeState ? setLoanTypeState(e.target.value) : setLoanType(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TAKEN">Take Loan</option>
                      <option value="RETURNED_TO_CONTACT">Return Loan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={loanDescription}
                      onChange={(e) => setLoanDescriptionState ? setLoanDescriptionState(e.target.value) : setLoanDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="self-end">
                    <button
                      onClick={handleAddLoan}
                      disabled={isCreatingLoan}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingLoan && <LoadingSpinner size="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="font-medium mb-4 text-blue-800">Transaction History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loanData?.transactions?.filter(t => t.type === 'TAKEN' || t.type === 'RETURNED_TO_CONTACT').map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-white border border-blue-200 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {transaction.type === 'TAKEN' ? '💵 Loan Taken' : '💳 Loan Returned'}
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-gray-600">{transaction.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`font-bold ${
                          transaction.type === 'TAKEN' ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {formatPakistaniCurrency(transaction.amount)}
                        </div>
                        <button
                          onClick={() => deleteLoanTransactionMutate(transaction.id)}
                          disabled={isDeletingLoan}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 mt-6 flex justify-end border-t border-gray-200 pt-4">
          <button
            onClick={() => {
              setShowLoanModal(false);
              setSelectedContact(null);
              setLoanAmount('');
              if (setLoanDescriptionState) setLoanDescriptionState(''); else setLoanDescription('');
              setActiveTab('given');
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
