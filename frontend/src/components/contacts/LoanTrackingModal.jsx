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
  setLoanDescriptionState,
  handleGenerateStatement,
  setShowStatementModal
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            {language === 'ur' ? 'لیجر (کھاتہ)' : 'Contact Ledger'} - {selectedContact.name}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto px-1 py-2">
          <div className="space-y-6">
            {/* Unified Summary Cards (Inclusive of Sales/Purchases) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-700">
                  {language === 'ur' ? 'کل ڈیبٹ / وصولی' : 'Total Debit (Charges)'}
                </h3>
                <p className="text-2xl font-bold text-green-800">
                  {formatPakistaniCurrency(selectedContact?.totalDebit || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">*Includes Sales and manual charges</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-sm font-medium text-purple-700">
                  {language === 'ur' ? 'کل کریڈٹ / ادائیگی' : 'Total Credit (Payments)'}
                </h3>
                <p className="text-2xl font-bold text-purple-800">
                  {formatPakistaniCurrency(selectedContact?.totalCredit || 0)}
                </p>
                <p className="text-xs text-purple-600 mt-1">*Includes Payments and returns</p>
              </div>
              <div className={`p-4 rounded-lg border ${
                (selectedContact?.outstandingBalance || 0) >= 0
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <h3 className={`text-sm font-medium ${
                  (selectedContact?.outstandingBalance || 0) >= 0 ? 'text-orange-700' : 'text-emerald-700'
                }`}>
                  {language === 'ur' ? 'باقی بقایا جات' : 'Net Outstanding Balance'}
                </h3>
                <p className={`text-2xl font-bold ${
                  (selectedContact?.outstandingBalance || 0) >= 0 ? 'text-orange-800' : 'text-emerald-800'
                }`}>
                  {formatPakistaniCurrency(Math.abs(selectedContact?.outstandingBalance || 0))}
                </p>
                <p className="text-xs mt-1">
                  {(selectedContact?.outstandingBalance || 0) >= 0 
                    ? (language === 'ur' ? 'آپ نے لینے ہیں' : 'Receivable') 
                    : (language === 'ur' ? 'آپ نے دینے ہیں' : 'Payable')}
                </p>
              </div>
            </div>

            {/* Simplified Add Entry Form */}
            <div className="bg-primary-50 p-5 rounded-lg border border-primary-200 shadow-sm">
              <h3 className="font-bold mb-4 text-primary-800 flex items-center gap-2">
                {language === 'ur' ? 'نئی انٹری درج کریں' : 'Add Ledger Entry'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanTypeState ? setLoanTypeState(e.target.value) : setLoanType(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="GIVEN">Debit / Charge / Money Given (+)</option>
                    <option value="TAKEN">Credit / Deposit / Money Received (+)</option>
                    {/* These two below are legacy/internal - we might want to guide user but let's keep it simple */}
                    <option value="RETURNED_BY_CONTACT">Payment Received (Credit -)</option>
                    <option value="RETURNED_TO_CONTACT">Payment Made (Debit -)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={loanDescription}
                    onChange={(e) => setLoanDescriptionState ? setLoanDescriptionState(e.target.value) : setLoanDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional note"
                  />
                </div>
                <div className="self-end">
                  <button
                    onClick={handleAddLoan}
                    disabled={isCreatingLoan}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {isCreatingLoan && <LoadingSpinner size="w-4 h-4" />}
                    Save Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Unified Manual History */}
            <div>
              <h3 className="font-bold mb-4 text-gray-800 border-b pb-2">
                {language === 'ur' ? 'لیجر ہسٹری (مینول انٹریز)' : 'Manual Ledger History'}
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {loanData?.transactions?.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary-300 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {transaction.type === 'GIVEN' && '💸 Debit / Charge'}
                        {transaction.type === 'TAKEN' && '💵 Credit / Deposit'}
                        {transaction.type === 'RETURNED_BY_CONTACT' && '💰 Payment Received (Credit)'}
                        {transaction.type === 'RETURNED_TO_CONTACT' && '💳 Payment Made (Debit)'}
                      </div>
                      {transaction.description && (
                        <div className="text-sm text-gray-600 italic">"{transaction.description}"</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-lg font-bold ${
                        (transaction.type === 'GIVEN' || transaction.type === 'RETURNED_TO_CONTACT') 
                          ? 'text-orange-600' 
                          : 'text-emerald-600'
                      }`}>
                        {formatPakistaniCurrency(transaction.amount)}
                      </div>
                      <button
                        onClick={() => deleteLoanTransactionMutate(transaction.id)}
                        disabled={isDeletingLoan}
                        title="Delete entry"
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                    No manual entries yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 mt-6 flex justify-between gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={() => {
              handleGenerateStatement(selectedContact.id);
              setShowLoanModal(false);
              setShowStatementModal(true);
            }}
            className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
          >
            📋 {language === 'ur' ? 'مکمل رپورٹ دیکھیں' : 'View Full Detailed Report'}
          </button>
          <button
            onClick={() => {
              setShowLoanModal(false);
              setSelectedContact(null);
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
