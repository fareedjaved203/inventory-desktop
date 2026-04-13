import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";

import API from "../utils/api";
import DeleteModal from "../components/DeleteModal";
import TableSkeleton from "../components/TableSkeleton";
import SaleDetailsModal from "../components/SaleDetailsModal";
import ReturnModal from "../components/ReturnModal";
import { useLanguage } from "../contexts/LanguageContext";

import { SalesHeader, SalesTable, SaleFormModal, useSalesForm } from "../components/sales";

function Sales() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const location = useLocation();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [saleForReturn, setSaleForReturn] = useState(null);
  const [returnType, setReturnType] = useState("partial");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showPendingPayments, setShowPendingPayments] = useState(
    location?.state?.showPendingPayments || false
  );
  const [showCreditBalance, setShowCreditBalance] = useState(
    location?.state?.showCreditBalance || false
  );
  const [contactFilter, setContactFilter] = useState("");
  const form = useSalesForm(language);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
  };

  const handleNewSale = () => {
    form.resetForm();
    form.setIsModalOpen(true);
  };

  // Reset page when switching between views
  useEffect(() => {
    setCurrentPage(1);
  }, [showPendingPayments, showCreditBalance]);

  // Fetch sales
  const { data: sales, isLoading, isFetching } = useQuery(
    [
      "sales",
      selectedDate,
      debouncedSearchTerm,
      showPendingPayments,
      showCreditBalance,
      contactFilter,
      currentPage,
    ],
    async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      };

      if (selectedDate) {
        const [year, month, day] = selectedDate.split("-");
        params.date = `${day}/${month}/${year}`;
      }

      if (contactFilter) {
        params.contactId = contactFilter;
      }

      // Use dedicated endpoints for pending payments and credit balance
      if (showPendingPayments) {
        const response = await API.get('/sales/pending-payments', { params });
        return response.data;
      }
      
      if (showCreditBalance) {
        const response = await API.get('/sales/credit-balance', { params });
        return response.data;
      }

      return await API.getSales(params);
    }
  );

  // Fetch audit trail for sales that have been edited
  const { data: auditTrails } = useQuery(
    ['sales-audit-trails', sales?.items?.map(s => s.id)],
    async () => {
      if (!sales?.items?.length) return {};
      
      const auditPromises = sales.items
        .filter(sale => {
          const created = new Date(sale.createdAt);
          const updated = new Date(sale.updatedAt);
          return Math.abs(updated - created) > 1000; // More than 1 second difference
        })
        .map(async (sale) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit-trail/Sale/${sale.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            const auditData = await response.json();
            return { saleId: sale.id, auditData };
          } catch (error) {
            console.error('Error fetching audit trail:', error);
            return { saleId: sale.id, auditData: [] };
          }
        });
      
      const results = await Promise.all(auditPromises);
      return results.reduce((acc, { saleId, auditData }) => {
        acc[saleId] = auditData;
        return acc;
      }, {});
    },
    { enabled: Boolean(sales?.items?.length) }
  );

  // Maintain search input focus
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [sales]);

  const [deleteError, setDeleteError] = useState(null);

  const deleteSale = useMutation(
    async (saleId) => {
      return await API.deleteSale(saleId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["sales"]);
        queryClient.invalidateQueries(["products"]);
        queryClient.invalidateQueries(['sales-audit-trails']);
        setDeleteError(null);
        setDeleteModalOpen(false);
        setSaleToDelete(null);
        toast.success('Sale deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(
          error.response?.data?.error ||
            "An error occurred while deleting the sale"
        );
      },
    }
  );

  // Global function for opening return modal from SaleDetailsModal
  useEffect(() => {
    window.openReturnModal = (sale, type = "partial") => {
      setSaleForReturn(sale);
      setReturnType(type);
      setReturnModalOpen(true);
    };
    return () => {
      delete window.openReturnModal;
    };
  }, []);

  // Listen for data storage invalidation events
  useEffect(() => {
    const handleDataInvalidation = () => {
      queryClient.invalidateQueries(["sales"]);
    };

    window.addEventListener('dataStorageInvalidate', handleDataInvalidation);
    return () => {
      window.removeEventListener('dataStorageInvalidate', handleDataInvalidation);
    };
  }, [queryClient]);

  const handleDelete = (sale) => {
    setSaleToDelete(sale);
    setDeleteModalOpen(true);
  };

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const confirmDelete = () => {
    if (saleToDelete) {
      deleteSale.mutate(saleToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm && !selectedDate && !showPendingPayments && !showCreditBalance) {
    return (
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
  }

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <SalesHeader
        language={language}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onClearDate={() => setSelectedDate("")}
        showPendingPayments={showPendingPayments}
        showCreditBalance={showCreditBalance}
        setShowPendingPayments={setShowPendingPayments}
        setShowCreditBalance={setShowCreditBalance}
        sales={sales}
        debouncedSearchTerm={debouncedSearchTerm}
        onNewSale={handleNewSale}
        searchInputRef={searchInputRef}
        contactFilter={contactFilter}
        setContactFilter={setContactFilter}
      />

      <SalesTable
        sales={sales}
        auditTrails={auditTrails}
        isFetching={isFetching}
        debouncedSearchTerm={debouncedSearchTerm}
        selectedDate={selectedDate}
        showPendingPayments={showPendingPayments}
        showCreditBalance={showCreditBalance}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        language={language}
        onView={(sale) => {
          setSelectedSale(sale);
          setDetailsModalOpen(true);
        }}
        onEdit={(sale) => form.handleEdit(sale)}
        onDelete={handleDelete}
      />

      <SaleFormModal language={language} form={form} />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSaleToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        itemName={
          saleToDelete
            ? `sale from ${new Date(
                saleToDelete.saleDate
              ).toLocaleDateString()}`
            : ""
        }
        error={deleteError}
      />

      {/* Sale Details Modal */}
      <SaleDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedSale(null);
          setReturnType("partial");
        }}
        sale={saleForReturn}
        returnType={returnType}
      />
    </div>
  );
}

export default Sales;
