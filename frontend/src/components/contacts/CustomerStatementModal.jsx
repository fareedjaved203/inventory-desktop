import { FaFileAlt, FaPrint } from 'react-icons/fa';
import { PDFDownloadLink } from '@react-pdf/renderer';
import LoadingSpinner from '../LoadingSpinner';
import CustomerStatementPDF from '../CustomerStatementPDF';
import UrduStatementHTML from '../UrduStatementHTML';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function CustomerStatementModal({
  t,
  selectedContact,
  statementStartDate,
  setStatementStartDate,
  statementEndDate,
  setStatementEndDate,
  handleGenerateStatement,
  generatingStatement,
  setShowStatementPDFPreferences,
  statementData,
  shopSettings,
  generateThermalStatementHtml,
  statementPdfPreferences,
  setShowStatementModal,
  setSelectedContact,
  setStatementData
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
          <FaFileAlt className="text-blue-600" />
          {t('customerStatement')} - {selectedContact.name}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('startDateOptional')}
              </label>
              <input
                type="date"
                value={statementStartDate}
                onChange={(e) => setStatementStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('endDateOptional')}
              </label>
              <input
                type="date"
                value={statementEndDate}
                onChange={(e) => setStatementEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• {t('leaveDatesEmpty')}</p>
            <p>• {t('statementIncludes')}</p>
            <p>• {t('runningBalanceShows')}</p>
            <p>• {t('salesIncreaseDebt')}</p>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <button
                onClick={handleGenerateStatement}
                disabled={generatingStatement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingStatement ? <LoadingSpinner size="w-4 h-4" /> : <FaFileAlt />}
                {generatingStatement ? 'Generating...' : t('generateStatement')}
              </button>
              
              <button
                onClick={() => setShowStatementPDFPreferences(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                PDF Settings
              </button>
            </div>
            
            <div className="flex gap-2">
              {statementData && shopSettings && (
                <>
                  <button
                    onClick={() => {
                      const thermalHtml = generateThermalStatementHtml(statementData, shopSettings, selectedContact);
                      const printWindow = window.open('', '_blank', 'width=400,height=600');
                      if (printWindow) {
                        printWindow.document.write(thermalHtml);
                        printWindow.document.close();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 500);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                  >
                    <FaPrint className="w-4 h-4" />
                    Thermal Print
                  </button>
                  {statementPdfPreferences.urduVersion ? (
                    <UrduStatementHTML
                      statementData={statementData}
                      shopSettings={shopSettings}
                      startDate={statementStartDate}
                      endDate={statementEndDate}
                      preferences={statementPdfPreferences}
                    />
                  ) : (
                    <PDFDownloadLink
                      document={
                        <CustomerStatementPDF 
                          statementData={statementData}
                          shopSettings={shopSettings}
                          startDate={statementStartDate}
                          endDate={statementEndDate}
                          preferences={statementPdfPreferences}
                        />
                      }
                      fileName={`${selectedContact.name.replace(/[^a-zA-Z0-9]/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      {({ loading }) => (
                        loading ? t('preparingPDF') : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            A4 PDF
                          </>
                        )
                      )}
                    </PDFDownloadLink>
                  )}
                </>
              )}
            </div>
          </div>
          
          {statementData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">{t('statementSummary')}:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('openingBalance')}:</span>
                  <span className={`ml-2 font-medium ${
                    statementData.openingBalance >= 0 ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {formatPakistaniCurrency(Math.abs(statementData.openingBalance))}
                    {statementData.openingBalance >= 0 ? ` (${t('receivable')})` : ` (${t('payable')})`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('closingBalance')}:</span>
                  <span className={`ml-2 font-medium ${
                    statementData.closingBalance >= 0 ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {formatPakistaniCurrency(Math.abs(statementData.closingBalance))}
                    {statementData.closingBalance >= 0 ? ` (${t('customerOwes')})` : ` (${t('weOwe')})`}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600">{t('totalTransactions')}:</span>
                <span className="ml-2 font-medium">{statementData.transactions?.length || 0}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              setShowStatementModal(false);
              setSelectedContact(null);
              setStatementStartDate('');
              setStatementEndDate('');
              setStatementData(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
