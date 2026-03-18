import React from 'react';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import StatementPDFPreferencesModal from '../components/StatementPDFPreferencesModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import {
  ContactsHeader,
  ContactsTable,
  ContactFormModal,
  LoanTrackingModal,
  CustomerStatementModal,
  useContacts
} from '../components/contacts';

function Contacts() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const {
    showAddModal, setShowAddModal,
    showDeleteModal, setShowDeleteModal,
    selectedContact, setSelectedContact,
    page, setPage,
    searchTerm,
    debouncedSearchTerm,
    deleteError, setDeleteError,
    showLoanModal, setShowLoanModal,
    loanAmount, setLoanAmount,
    loanType, setLoanType,
    loanDescription, setLoanDescription,
    activeTab, setActiveTab,
    showStatementModal, setShowStatementModal,
    statementStartDate, setStatementStartDate,
    statementEndDate, setStatementEndDate,
    statementData, setStatementData,
    shopSettings,
    contactTypeFilter, setContactTypeFilter,
    showStatementPDFPreferences, setShowStatementPDFPreferences,
    statementPdfPreferences, setStatementPdfPreferences,
    generatingStatement,
    register, handleSubmit, reset, errors,
    contactsData, isLoading, isFetching, error,
    loanData,
    isCreatingContact,
    isUpdatingContact,
    isDeletingLoan,
    isCreatingLoan,
    handleSearchChange,
    onSubmit,
    handleDelete,
    handleEdit,
    handleAddLoan,
    handleGenerateStatement,
    generateThermalStatementHtml,
    searchInputRef,
    deleteLoanTransactionMutate
  } = useContacts();

  if (isLoading && !debouncedSearchTerm) return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="h-10 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <TableSkeleton rows={10} columns={4} />
    </div>
  );

  if (error) return (
    <div className="p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error.message || 'Failed to fetch contacts'}</span>
      </div>
    </div>
  );

  return (
    <div className={`p-6 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <ContactsHeader
        t={t}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        contactTypeFilter={contactTypeFilter}
        setContactTypeFilter={setContactTypeFilter}
        setShowAddModal={setShowAddModal}
        setSelectedContact={setSelectedContact}
        reset={reset}
      />

      <ContactsTable
        t={t}
        isFetching={isFetching}
        debouncedSearchTerm={debouncedSearchTerm}
        contactsData={contactsData}
        handleEdit={handleEdit}
        setSelectedContact={setSelectedContact}
        setShowLoanModal={setShowLoanModal}
        setShowStatementModal={setShowStatementModal}
        setStatementStartDate={setStatementStartDate}
        setStatementEndDate={setStatementEndDate}
        setStatementData={setStatementData}
        setStatementPdfPreferences={setStatementPdfPreferences}
        setShowDeleteModal={setShowDeleteModal}
      />

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          {t('previous')}
        </button>
        <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
          {language === 'ur' ? `صفحہ ${page} از ${contactsData?.totalPages || 1}` : `Page ${page} of ${contactsData?.totalPages || 1}`}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(contactsData?.totalPages || 1, p + 1))}
          disabled={page === (contactsData?.totalPages || 1)}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          {t('next')}
        </button>
      </div>

      {showAddModal && (
        <ContactFormModal
          t={t}
          selectedContact={selectedContact}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          register={register}
          errors={errors}
          setShowAddModal={setShowAddModal}
          setSelectedContact={setSelectedContact}
          reset={reset}
          isCreatingContact={isCreatingContact}
          isUpdatingContact={isUpdatingContact}
        />
      )}

      {showDeleteModal && selectedContact && (
        <DeleteModal
          isOpen={showDeleteModal}
          itemName={selectedContact.name}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedContact(null);
            setDeleteError(null);
          }}
          error={deleteError}
        />
      )}

      {showLoanModal && selectedContact && (
        <LoanTrackingModal
          language={language}
          selectedContact={selectedContact}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setLoanType={setLoanType}
          loanData={loanData}
          loanType={loanType}
          loanAmount={loanAmount}
          setLoanAmount={setLoanAmount}
          loanDescription={loanDescription}
          setLoanDescription={setLoanDescription}
          handleAddLoan={handleAddLoan}
          isCreatingLoan={isCreatingLoan}
          deleteLoanTransactionMutate={deleteLoanTransactionMutate}
          isDeletingLoan={isDeletingLoan}
          setShowLoanModal={setShowLoanModal}
          setSelectedContact={setSelectedContact}
          handleGenerateStatement={handleGenerateStatement}
          setShowStatementModal={setShowStatementModal}
        />
      )}

      {showStatementModal && selectedContact && (
        <CustomerStatementModal
          t={t}
          selectedContact={selectedContact}
          statementStartDate={statementStartDate}
          setStatementStartDate={setStatementStartDate}
          statementEndDate={statementEndDate}
          setStatementEndDate={setStatementEndDate}
          handleGenerateStatement={handleGenerateStatement}
          generatingStatement={generatingStatement}
          setShowStatementPDFPreferences={setShowStatementPDFPreferences}
          statementData={statementData}
          shopSettings={shopSettings}
          generateThermalStatementHtml={generateThermalStatementHtml}
          statementPdfPreferences={statementPdfPreferences}
          setShowStatementModal={setShowStatementModal}
          setSelectedContact={setSelectedContact}
          setStatementData={setStatementData}
        />
      )}
      
      <StatementPDFPreferencesModal
        isOpen={showStatementPDFPreferences}
        onClose={() => setShowStatementPDFPreferences(false)}
        onSave={(prefs) => setStatementPdfPreferences(prefs)}
      />
    </div>
  );
}

export default Contacts;