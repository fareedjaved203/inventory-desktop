import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import API from "../../utils/api";
import { z } from "zod";
import { useTranslation } from "../../utils/translations";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
  saleDate: z.string().optional(),
});

export function useSalesForm(language) {
  const queryClient = useQueryClient();
  const t = useTranslation(language);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [priceType, setPriceType] = useState("retail");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [productSelected, isProductSelected] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [saleDate, setSaleDate] = useState("");
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [debouncedContactSearchTerm, setDebouncedContactSearchTerm] = useState("");
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: "", phoneNumber: "", address: "" });
  const [creatingContact, setCreatingContact] = useState(false);
  const [orderBookerSearchTerm, setOrderBookerSearchTerm] = useState("");
  const [debouncedOrderBookerSearchTerm, setDebouncedOrderBookerSearchTerm] = useState("");
  const [selectedOrderBooker, setSelectedOrderBooker] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [loadingDate, setLoadingDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [changeDate, setChangeDate] = useState("");
  const [updatedAmount, setUpdatedAmount] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [tempStockUpdates, setTempStockUpdates] = useState({});

  const resetForm = () => {
    setIsModalOpen(false);
    setSaleItems([]);
    setSelectedProduct(null);
    setQuantity("");
    setProductSearchTerm("");
    isProductSelected(false);
    setPriceType("retail");
    setSelectedContact(null);
    setContactSearchTerm("");
    setCreateNewContact(false);
    setNewContactData({ name: "", phoneNumber: "", address: "" });
    setSaleDate("");
    setDescription("");
    setSelectedTransport(null);
    setTransportSearchTerm("");
    setTransportCost("");
    setLoadingDate("");
    setArrivalDate("");
    setPaymentDescription("");
    setChangeDate("");
    setUpdatedAmount("");
    setValidationErrors({});
    setTempStockUpdates({});
    setTotalAmount(0);
    setDiscount(0);
    setPaidAmount("");
    setIsEditMode(false);
    setEditingSale(null);
  };

  const debouncedProductSearch = useCallback(debounce((term) => setDebouncedProductSearchTerm(term), 300), []);
  const debouncedContactSearch = useCallback(debounce((term) => setDebouncedContactSearchTerm(term), 300), []);
  const debouncedOrderBookerSearch = useCallback(debounce((term) => setDebouncedOrderBookerSearchTerm(term), 300), []);

  const handleProductSearchChange = (value) => { setProductSearchTerm(value); debouncedProductSearch(value); };
  const handleContactSearchChange = (value) => { setContactSearchTerm(value); debouncedContactSearch(value); };
  const handleOrderBookerSearchChange = (value) => { setOrderBookerSearchTerm(value); debouncedOrderBookerSearch(value); };

  const { data: products, isLoading: productsLoading } = useQuery(
    ["products", debouncedProductSearchTerm],
    async () => (await API.getProducts({ limit: 100, search: debouncedProductSearchTerm })).items
  );

  const { data: contacts, isLoading: contactsLoading } = useQuery(
    ["contacts", debouncedContactSearchTerm],
    async () => (await API.getContacts({ limit: 100, search: debouncedContactSearchTerm })).items
  );

  const { data: orderBookers, isLoading: orderBookersLoading } = useQuery(
    ["order-bookers", debouncedOrderBookerSearchTerm],
    async () => (await API.getContacts({ limit: 100, search: debouncedOrderBookerSearchTerm, contactType: "order_booker" })).items
  );

  useEffect(() => {
    if (products) {
      setFilteredProducts(products.map((p) => ({ ...p, quantity: p.quantity - (tempStockUpdates[p.id] || 0) })));
    }
  }, [products, tempStockUpdates]);

  const calculateTotal = () => saleItems.reduce((sum, item) => sum + item.subtotal, 0);

  useEffect(() => {
    const subtotal = calculateTotal();
    const discountAmount = (subtotal * (parseFloat(discount) || 0)) / 100;
    setTotalAmount(Math.round(subtotal - discountAmount));
  }, [saleItems, discount]);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      setValidationErrors({ ...validationErrors, product: !selectedProduct ? t("productIsRequired") : undefined, quantity: !quantity ? t("quantityIsRequired") : undefined });
      return;
    }
    if (productSearchTerm && !selectedProduct) {
      setValidationErrors({ ...validationErrors, product: t("pleaseSelectValidProduct") });
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (quantityNum > selectedProduct.quantity) {
      setValidationErrors({ quantity: t("onlyUnitsAvailable").replace("{count}", selectedProduct.quantity) });
      return;
    }
    const existingItemIndex = saleItems.findIndex((item) => item.productId === selectedProduct.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantityNum;
      if (newQuantity > selectedProduct.quantity) {
        setValidationErrors({ quantity: `${t("onlyUnitsAvailable").replace("{count}", selectedProduct.quantity)} (${existingItem.quantity} ${t("alreadyAdded")})` });
        return;
      }
      updatedItems[existingItemIndex] = { ...existingItem, quantity: newQuantity, subtotal: existingItem.price * newQuantity };
      setSaleItems(updatedItems);
    } else {
      const selectedPrice = priceType === "wholesale" && selectedProduct.wholesalePrice ? selectedProduct.wholesalePrice : (selectedProduct.retailPrice || selectedProduct.price || 0);
      setSaleItems([...saleItems, { productId: selectedProduct.id, productName: selectedProduct.name, quantity: quantityNum, price: selectedPrice, priceType, subtotal: selectedPrice * quantityNum }]);
    }
    setTempStockUpdates((prev) => ({ ...prev, [selectedProduct.id]: (prev[selectedProduct.id] || 0) + quantityNum }));
    setSelectedProduct(null);
    setQuantity("");
    setProductSearchTerm("");
    setPriceType("retail");
    setValidationErrors({});
    isProductSelected(false);
  };

  const handlePriceChange = (index, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], price, subtotal: price * updatedItems[index].quantity };
    setSaleItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const removedItem = saleItems[index];
    setSaleItems(saleItems.filter((_, i) => i !== index));
    setTempStockUpdates((prev) => {
      const newUpdates = { ...prev };
      const newReduction = (newUpdates[removedItem.productId] || 0) - removedItem.quantity;
      if (newReduction <= 0) delete newUpdates[removedItem.productId];
      else newUpdates[removedItem.productId] = newReduction;
      return newUpdates;
    });
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setSaleItems(sale.items?.map((item) => ({ productId: item.product.id, productName: item.product.name, quantity: item.quantity, price: item.price, priceType: item.priceType || "retail", subtotal: item.price * item.quantity })));
    setTotalAmount(sale.totalAmount);
    const subtotal = sale.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    setDiscount(subtotal > 0 ? (((sale.discount || 0) / subtotal) * 100).toFixed(1) : 0);
    setPaidAmount(sale.paidAmount || 0);
    setSelectedContact(sale.contact || null);
    setSelectedOrderBooker(sale.orderBooker || null);
    setOrderBookerSearchTerm(sale.orderBooker?.name || "");
    const d = new Date(sale.saleDate);
    setSaleDate(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
    setDescription(sale.description || "");
    setTransportSearchTerm(sale.carNumber || "");
    setTransportCost(sale.transportCost || "");
    setLoadingDate(sale.loadingDate?.split("T")[0] || "");
    setArrivalDate(sale.arrivalDate?.split("T")[0] || "");
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const createSale = useMutation(async (saleData) => API.createSale(saleData), {
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["sales-audit-trails"]);
      queryClient.invalidateQueries(["products"]);
      resetForm();
      toast.success("Sale created successfully!");
    },
  });

  const updateSale = useMutation(async (updatedSale) => API.updateSale(updatedSale.id, updatedSale), {
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["sales-audit-trails"]);
      resetForm();
      toast.success("Sale updated successfully!");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let contactId = selectedContact?.id;

    if (createNewContact && newContactData.name && newContactData.phoneNumber) {
      try {
        setCreatingContact(true);
        const res = await API.createContact({ ...newContactData, contactType: "customer" });
        contactId = res.data.id;
      } catch (error) {
        setValidationErrors({ contact: error.response?.data?.error || "Failed to create contact" });
        return;
      } finally {
        setCreatingContact(false);
      }
    }

    if (contactSearchTerm && !selectedContact && !createNewContact) {
      setValidationErrors({ ...validationErrors, contact: t("pleaseSelectValidContact") });
      return;
    }

    if (totalAmount > 100000000) {
      setValidationErrors({ ...validationErrors, total: t("saleTotalCannotExceed") });
      return;
    }

    if (!saleItems || saleItems.length === 0) {
      setValidationErrors({ items: "At least one item is required" });
      return;
    }

    const discountAmount = (calculateTotal() * (parseFloat(discount) || 0)) / 100;
    const saleData = {
      items: saleItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity), price: Number(item.price), priceType: item.priceType || "retail" })),
      totalAmount: Number(Math.round(totalAmount)),
      originalTotalAmount: Number(Math.round(calculateTotal())),
      discount: Number(discountAmount),
      paidAmount: Number(parseFloat(paidAmount) || 0),
      ...(contactId && { contactId }),
      ...(selectedOrderBooker?.id && { orderBookerId: selectedOrderBooker.id }),
      ...(saleDate && { saleDate }),
      description: description || null,
      carNumber: transportSearchTerm || null,
      transportCost: transportCost ? Number(parseFloat(transportCost)) : null,
      loadingDate: loadingDate || null,
      arrivalDate: arrivalDate || null,
      ...(localStorage.getItem("employeeId") && { employeeId: localStorage.getItem("employeeId") }),
      ...(paymentDescription && { paymentDescription }),
      ...(changeDate && { changeDate }),
    };

    try {
      saleSchema.parse(saleData);
      setValidationErrors({});
      if (isEditMode) updateSale.mutate({ ...saleData, id: editingSale.id });
      else createSale.mutate(saleData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => { errors[err.path.join(".")] = err.message; });
        setValidationErrors(errors);
      }
    }
  };

  return {
    // modal state
    isModalOpen, setIsModalOpen,
    isEditMode, setIsEditMode,
    editingSale, setEditingSale,
    // form state
    saleItems, setSaleItems,
    selectedProduct, setSelectedProduct,
    quantity, setQuantity,
    priceType, setPriceType,
    productSelected, isProductSelected,
    totalAmount, setTotalAmount,
    discount, setDiscount,
    paidAmount, setPaidAmount,
    selectedContact, setSelectedContact,
    saleDate, setSaleDate,
    contactSearchTerm, setContactSearchTerm,
    createNewContact, setCreateNewContact,
    newContactData, setNewContactData,
    creatingContact,
    orderBookerSearchTerm, setOrderBookerSearchTerm,
    selectedOrderBooker, setSelectedOrderBooker,
    description, setDescription,
    selectedTransport, setSelectedTransport,
    transportSearchTerm, setTransportSearchTerm,
    transportCost, setTransportCost,
    loadingDate, setLoadingDate,
    arrivalDate, setArrivalDate,
    paymentDescription, setPaymentDescription,
    changeDate, setChangeDate,
    updatedAmount, setUpdatedAmount,
    productSearchTerm, setProductSearchTerm,
    filteredProducts,
    tempStockUpdates, setTempStockUpdates,
    validationErrors, setValidationErrors,
    // data
    products, productsLoading,
    contacts, contactsLoading,
    orderBookers, orderBookersLoading,
    // mutations
    createSale, updateSale,
    // handlers
    handleProductSearchChange,
    handleContactSearchChange,
    handleOrderBookerSearchChange,
    handleAddItem,
    handlePriceChange,
    handleRemoveItem,
    handleEdit,
    handleSubmit,
    calculateTotal,
    resetForm,
  };
}
