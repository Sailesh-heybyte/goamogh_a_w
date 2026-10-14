"use client";
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, Edit2, Check, AlertCircle, Loader, ShoppingBag, Eye, ChevronRight, Clock, ArrowLeft, Package, MapPin, Plus, Trash2, FileText, Download, Star } from 'lucide-react';
import { fetchOrderHistory, fetchOrderDetails, fetchAddresses, createAddress, updateAddress, deleteAddress, downloadInvoicePdf } from '../api/api';
import OrderFeedbackModal from '../components/OrderFeedbackModal';

function getOrderStatusLabel(status, paymentStatus) {
    if (status === 'draft' && paymentStatus === 'paid') return { label: 'Order Received (Processing)', color: 'blue', step: 1 };
    if (status === 'draft' && paymentStatus === 'unpaid') return { label: 'Awaiting Payment', color: 'orange', step: 1 };
    if (status === 'draft' && paymentStatus === 'pending') return { label: 'Payment Processing', color: 'orange', step: 1 };
    if (paymentStatus === 'refunded') return { label: 'Refunded', color: 'red', step: 0 };
    if (status === 'confirmed') return { label: 'Order Confirmed', color: 'blue', step: 2 };
    if (status === 'dispatched') return { label: 'Out for Delivery', color: 'purple', step: 3 };
    if (status === 'delivered') return { label: 'Delivered', color: 'green', step: 4 };
    if (status === 'invoiced') return { label: 'Completed', color: 'green', step: 4 };
    if (status === 'cancelled') return { label: 'Cancelled', color: 'red', step: 0 };
    if (status === 'failed_delivery') return { label: 'Delivery Failed', color: 'red', step: 3 };
    return { label: status || 'Pending', color: 'gray', step: 0 };
}

function getStatusBadgeStyle(color) {
    switch (color) {
        case 'orange': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        case 'red': return 'bg-red-500/20 text-red-400 border border-red-500/30';
        case 'blue': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'purple': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
        case 'green': return 'bg-green-500/20 text-green-400 border border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
}

export default function ProfilePage() {
    const { user, token, loading, updateProfile, triggerLoginModal } = useAuth();

    // Tab State
    const [activeTab, setActiveTab] = useState('profile');

    // Order History States
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [invoiceDownloadError, setInvoiceDownloadError] = useState('');

    // Feedback Modal State
    const [feedbackOrder, setFeedbackOrder] = useState(null);

    const handleDownloadInvoice = async (invoiceId) => {
        if (!token || !invoiceId) return;
        try {
            setDownloadingInvoiceId(invoiceId);
            setInvoiceDownloadError('');
            const blob = await downloadInvoicePdf(token, invoiceId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoiceId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download invoice PDF:', err);
            setInvoiceDownloadError(err.message || 'Failed to download Tax Invoice PDF.');
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'orders') {
                setActiveTab('orders');
            }
        }
    }, []);

    const loadOrders = async () => {
        if (token) {
            try {
                setLoadingOrders(true);
                setOrdersError(null);
                const response = await fetchOrderHistory(token);
                if (response.success && Array.isArray(response.data)) {
                    setOrders(response.data);
                } else {
                    setOrders([]);
                }
            } catch (err) {
                console.error('Failed to load orders:', err);
                setOrdersError('Failed to retrieve order history. Please try again.');
            } finally {
                setLoadingOrders(false);
            }
        }
    };

    // Detect URL query parameters for direct tracking redirect
    useEffect(() => {
        if (typeof window !== 'undefined' && token) {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            const orderIdParam = params.get('orderId');
            if (tabParam === 'orders') {
                setActiveTab('orders');
                if (orderIdParam) {
                    handleViewOrderDetails(orderIdParam);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Active order status polling (every 30 seconds)
    useEffect(() => {
        if (!selectedOrderId || !selectedOrderDetails || !token) return;

        const activeStatuses = ['draft', 'confirmed', 'dispatched'];
        if (!activeStatuses.includes(selectedOrderDetails.status)) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetchOrderDetails(token, selectedOrderId);
                if (response.success && response.data) {
                    setSelectedOrderDetails(response.data);
                }
            } catch (err) {
                console.error('Failed to poll order status:', err);
            }
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [selectedOrderId, selectedOrderDetails, token]);

    useEffect(() => {
        if (activeTab === 'orders' && token) {
            loadOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, token]);

    const handleViewOrderDetails = async (indentId) => {
        setSelectedOrderId(indentId);
        setSelectedOrderDetails(null);
        try {
            setLoadingOrderDetails(true);
            const response = await fetchOrderDetails(token, indentId);
            if (response.success && response.data) {
                setSelectedOrderDetails(response.data);
            }
        } catch (err) {
            console.error('Failed to load order details:', err);
        } finally {
            setLoadingOrderDetails(false);
        }
    };

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });

    // Feedback states
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Load user data into form when user context updates
    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    // Address management states
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addressFormOpen, setAddressFormOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressError, setAddressError] = useState('');
    const [addressSuccess, setAddressSuccess] = useState('');
    const [addressFormData, setAddressFormData] = useState({
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: 'Andhra Pradesh',
        postal_code: '',
        country: 'India',
        landmark: '',
        phone: user?.phone || '',
        is_default: false
    });

    const loadAddresses = async () => {
        if (!token) return;
        try {
            setLoadingAddresses(true);
            const res = await fetchAddresses(token);
            if (res.success && Array.isArray(res.data)) {
                const normalized = res.data.map(addr => ({
                    ...addr,
                    name: addr.name || user?.name || user?.full_name || 'Customer',
                    country: addr.country || 'India'
                }));
                const sorted = [...normalized].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
                setAddresses(sorted);
            } else {
                setAddresses([]);
            }
        } catch (err) {
            console.error('Failed to load addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'addresses' && token) {
            loadAddresses();
        }
    }, [activeTab, token]);

    const handleAddressInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setAddressError('');
        setAddressSuccess('');

        if (!addressFormData.name || addressFormData.name.trim().length < 2) {
            setAddressError('Full Name is required (at least 2 characters).');
            return;
        }
        const phoneClean = addressFormData.phone.replace(/\D/g, '');
        if (!/^\d{10}$/.test(phoneClean)) {
            setAddressError('Phone number must be a valid 10-digit number.');
            return;
        }
        if (!addressFormData.address_line_1.trim() || addressFormData.address_line_1.trim().length < 3) {
            setAddressError('Address Line 1 is required (at least 3 characters).');
            return;
        }
        if (!addressFormData.city.trim() || addressFormData.city.trim().length < 2) {
            setAddressError('City is required.');
            return;
        }
        if (!addressFormData.state || !addressFormData.state.trim()) {
            setAddressError('State selection is required.');
            return;
        }
        const postalCodeClean = addressFormData.postal_code.replace(/\D/g, '');
        if (!/^\d{6}$/.test(postalCodeClean)) {
            setAddressError('PIN Code (Postal Code) must be exactly 6 numeric digits.');
            return;
        }
        if (!addressFormData.country || !addressFormData.country.trim()) {
            setAddressError('Country selection is required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: addressFormData.name.trim(),
                address_line_1: addressFormData.address_line_1.trim(),
                address_line_2: addressFormData.address_line_2 ? addressFormData.address_line_2.trim() : null,
                city: addressFormData.city.trim(),
                state: addressFormData.state.trim(),
                postal_code: postalCodeClean,
                country: addressFormData.country.trim() || 'India',
                landmark: addressFormData.landmark ? addressFormData.landmark.trim() : null,
                phone: phoneClean,
                is_default: addressFormData.is_default
            };

            let res;
            if (editingAddressId) {
                res = await updateAddress(token, editingAddressId, payload);
            } else {
                if (addresses.length === 0) {
                    payload.is_default = true;
                }
                res = await createAddress(token, payload);
            }

            if (res.success) {
                setAddressSuccess(editingAddressId ? 'Address updated successfully!' : 'Address added successfully!');
                setAddressFormOpen(false);
                setEditingAddressId(null);
                setAddressFormData({
                    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
                    address_line_1: '',
                    address_line_2: '',
                    city: '',
                    state: 'Andhra Pradesh',
                    postal_code: '',
                    country: 'India',
                    landmark: '',
                    phone: user?.phone || '',
                    is_default: false
                });
                loadAddresses();
                setTimeout(() => setAddressSuccess(''), 4000);
            } else {
                setAddressError(res.message || 'Failed to save address.');
            }
        } catch (err) {
            setAddressError(err.message || 'An error occurred while saving address.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditAddressClick = (addr) => {
        setEditingAddressId(addr.id);
        setAddressFormData({
            name: addr.name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''),
            address_line_1: addr.address_line_1,
            address_line_2: addr.address_line_2 || '',
            city: addr.city,
            state: addr.state,
            postal_code: addr.postal_code,
            country: addr.country || 'India',
            landmark: addr.landmark || '',
            phone: addr.phone,
            is_default: addr.is_default
        });
        setAddressError('');
        setAddressSuccess('');
        setAddressFormOpen(true);
    };

    const handleDeleteAddressClick = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            const res = await deleteAddress(token, addressId);
            if (res.success) {
                loadAddresses();
            }
        } catch (err) {
            console.error('Failed to delete address:', err);
        }
    };

    const openAddAddressForm = () => {
        setEditingAddressId(null);
        setAddressFormData({
            name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: 'Andhra Pradesh',
            postal_code: '',
            country: 'India',
            landmark: '',
            phone: user ? user.phone : '',
            is_default: addresses.length === 0
        });
        setAddressError('');
        setAddressSuccess('');
        setAddressFormOpen(true);
    };

    const closeAddressForm = () => {
        setAddressFormOpen(false);
        setEditingAddressId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || ''
            });
        }
        setValidationError('');
        setApiError('');
        setIsEditing(false);
    };

    const validateForm = () => {
        if (!formData.first_name.trim()) {
            setValidationError('First name is required.');
            return false;
        }
        if (!formData.last_name.trim()) {
            setValidationError('Last name is required.');
            return false;
        }
        if (!formData.email.trim()) {
            setValidationError('Email address is required.');
            return false;
        }
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setValidationError('Please enter a valid email address.');
            return false;
        }
        setValidationError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setSuccessMessage('');

        if (!validateForm()) return;

        try {
            setSaving(true);
            const response = await updateProfile({
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim()
            });

            if (response && response.success) {
                setSuccessMessage('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                setApiError(response?.message || 'Failed to update profile. Please try again.');
            }
        } catch (err) {
            console.error('Update profile error:', err);
            setApiError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Helper to extract initials
    const getInitials = () => {
        const f = formData.first_name ? formData.first_name.charAt(0).toUpperCase() : '';
        const l = formData.last_name ? formData.last_name.charAt(0).toUpperCase() : '';
        return f || l ? `${f}${l}` : 'U';
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.replace(' ', 'T')); // Handle format '2026-06-11 10:02:14.567890'
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString.split(' ')[0] || dateString;
        }
    };

    const detailHelpers = selectedOrderDetails ? {
        saleOrIndentNumber: selectedOrderDetails.sale_number || selectedOrderDetails.indent_number || '',
        isSale: !!selectedOrderDetails.sale_number,
        taxableAmount: selectedOrderDetails.total_taxable_amount !== undefined
            ? selectedOrderDetails.total_taxable_amount
            : selectedOrderDetails.totals?.total_taxable || 0,
        cgstAmount: selectedOrderDetails.total_cgst_amount !== undefined
            ? selectedOrderDetails.total_cgst_amount
            : selectedOrderDetails.totals?.cgst_amount || 0,
        sgstAmount: selectedOrderDetails.total_sgst_amount !== undefined
            ? selectedOrderDetails.total_sgst_amount
            : selectedOrderDetails.totals?.sgst_amount || 0,
        igstAmount: selectedOrderDetails.total_igst_amount !== undefined
            ? selectedOrderDetails.total_igst_amount
            : selectedOrderDetails.totals?.igst_amount || 0,
        totalCess: selectedOrderDetails.total_cess_amount !== undefined
            ? selectedOrderDetails.total_cess_amount
            : selectedOrderDetails.totals?.total_cess || 0,
        grandTotal: selectedOrderDetails.total_amount !== undefined
            ? selectedOrderDetails.total_amount
            : selectedOrderDetails.totals?.grand_total || 0,
        orderItems: selectedOrderDetails.invoice_lines || selectedOrderDetails.items || [],
        orderStatus: selectedOrderDetails.status || (selectedOrderDetails.sale_number ? 'completed' : 'pending')
    } : null;

    // Loading State
    if (loading) {
        return (
            <main className="min-h-screen bg-[#1a2416] flex items-center justify-center pt-20">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-[#d8b66a] animate-spin mx-auto mb-4" />
                    <p className="text-[#efe3bf]/70 font-mono text-sm tracking-widest uppercase">Loading Profile...</p>
                </div>
            </main>
        );
    }

    // Unauthenticated State
    if (!user || !token) {
        return (
            <main className="min-h-screen bg-[#1a2416] pt-36 pb-20 px-4 md:px-8 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-md w-full text-center rounded-[32px] bg-[#0b150d] p-8 md:p-12 shadow-[0_24px_50px_rgba(0,0,0,0.4)] border border-[#d8b66a]/10"
                >
                    <div className="w-16 h-16 rounded-full bg-[#d8b66a]/10 text-[#d8b66a] flex items-center justify-center mx-auto mb-6 border border-[#d8b66a]/20">
                        <User size={30} />
                    </div>
                    <h1 className="font-serif text-3xl text-[#f3e7c6] mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                        Access Denied
                    </h1>
                    <p className="text-[#efe3bf]/60 font-sans text-sm mb-8 leading-relaxed">
                        Please log in to view and manage your account details, purchase history, and delivery details.
                    </p>
                    <button
                        onClick={() => triggerLoginModal()}
                        className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-xs shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        Log In Now
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#1a2416] pt-36 pb-20 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[32px] bg-[#0b150d] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-[#d8b66a]/10"
                >
                    {/* Header Summary */}
                    <div className="relative p-8 md:p-10 border-b border-[#d8b66a]/5 bg-gradient-to-b from-[#11180f] to-transparent flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#d8b66a] to-[#c5a47e] text-[#0b150d] flex items-center justify-center font-sans text-2xl font-bold tracking-wider shadow-xl shadow-[#d8b66a]/10">
                                {getInitials()}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-[#d8b66a] text-[#0b150d] p-1.5 rounded-full shadow border border-[#0b150d]">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Title Info */}
                        <div className="flex-1">
                            <h1 className="font-sans font-bold text-2xl md:text-3xl text-[#f3e7c6] mt-1 mb-2 tracking-tight">
                                {user.first_name || user.last_name
                                    ? `${user.first_name} ${user.last_name}`.trim()
                                    : 'Customer'
                                }
                            </h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-[#efe3bf]/85 font-semibold mt-3 font-mono">
                                <span className="flex items-center gap-1.5">
                                    <Phone size={12} className="text-[#d8b66a]" /> {user.phone}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-[#d8b66a]" /> Member since {formatDate(user.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Selector */}
                    <div className="flex border-b border-[#d8b66a]/10 bg-[#11180f]/30 font-serif text-xs uppercase tracking-widest font-bold">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('profile'); setSelectedOrderId(null); }}
                            className={`flex-1 py-4 text-center border-b-2 transition duration-300 cursor-pointer ${activeTab === 'profile'
                                ? 'border-[#d8b66a] text-[#d8b66a]'
                                : 'border-transparent text-[#efe3bf]/60 hover:text-[#efe3bf] hover:bg-white/5'
                                }`}
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            Profile Details
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('addresses'); setSelectedOrderId(null); }}
                            className={`flex-1 py-4 text-center border-b-2 transition duration-300 cursor-pointer ${activeTab === 'addresses'
                                ? 'border-[#d8b66a] text-[#d8b66a]'
                                : 'border-transparent text-[#efe3bf]/60 hover:text-[#efe3bf] hover:bg-white/5'
                                }`}
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            My Addresses
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); }}
                            className={`flex-1 py-4 text-center border-b-2 transition duration-300 cursor-pointer ${activeTab === 'orders'
                                ? 'border-[#d8b66a] text-[#d8b66a]'
                                : 'border-transparent text-[#efe3bf]/60 hover:text-[#efe3bf] hover:bg-white/5'
                                }`}
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            Order History
                        </button>
                    </div>

                    {/* Details Form Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Alert Messages */}
                                <AnimatePresence mode="wait">
                                    {validationError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono"
                                        >
                                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                                            <span>{validationError}</span>
                                        </motion.div>
                                    )}

                                    {apiError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono"
                                        >
                                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                                            <span>{apiError}</span>
                                        </motion.div>
                                    )}

                                    {successMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-xs flex items-center gap-3 font-mono"
                                        >
                                            <Check size={16} className="text-green-400 shrink-0" />
                                            <span>{successMessage}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Two Column Names */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <label
                                            className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            First Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing || saving}
                                                className={`w-full bg-[#11180f]/50 text-[#efe3bf] border rounded-xl pl-12 pr-4 py-4 font-sans text-sm focus:outline-none transition-all duration-300 ${isEditing
                                                    ? 'border-[#d8b66a]/30 focus:border-[#d8b66a] focus:bg-[#11180f]'
                                                    : 'border-white/5 opacity-80 cursor-not-allowed'
                                                    }`}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <label
                                            className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            Last Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing || saving}
                                                className={`w-full bg-[#11180f]/50 text-[#efe3bf] border rounded-xl pl-12 pr-4 py-4 font-sans text-sm focus:outline-none transition-all duration-300 ${isEditing
                                                    ? 'border-[#d8b66a]/30 focus:border-[#d8b66a] focus:bg-[#11180f]'
                                                    : 'border-white/5 opacity-80 cursor-not-allowed'
                                                    }`}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email field */}
                                <div className="space-y-2">
                                    <label
                                        className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={!isEditing || saving}
                                            className={`w-full bg-[#11180f]/50 text-[#efe3bf] border rounded-xl pl-12 pr-4 py-4 font-sans text-sm focus:outline-none transition-all duration-300 ${isEditing
                                                ? 'border-[#d8b66a]/30 focus:border-[#d8b66a] focus:bg-[#11180f]'
                                                : 'border-white/5 opacity-80 cursor-not-allowed'
                                                }`}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>

                                {/* Phone field - Always Disabled */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label
                                            className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            Phone Number
                                        </label>
                                        <span className="text-[9px] text-[#efe3bf]/30 uppercase font-mono tracking-wider font-semibold">Locked (Linked to OTP)</span>
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={user.phone}
                                            disabled
                                            className="w-full bg-[#11180f]/20 text-[#efe3bf]/40 border border-white/5 rounded-xl pl-12 pr-4 py-4 font-sans text-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Button actions */}
                                <div className="pt-6 border-t border-[#d8b66a]/5 flex gap-4">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={saving}
                                                className="flex-1 border border-white/10 hover:border-white/20 text-[#efe3bf]/85 hover:text-white font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[10px] transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                                style={{ fontFamily: "'Cinzel', serif" }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex-1 bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-[#d8b66a]/50 text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[10px] shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                                                style={{ fontFamily: "'Cinzel', serif" }}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader className="w-3 h-3 animate-spin text-[#0b150d]" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <span>Save Changes</span>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[10px] shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            <Edit2 size={13} />
                                            <span>Edit Profile Details</span>
                                        </button>
                                    )}
                                </div>

                            </form>
                        </div>
                    )}

                    {/* Order History Tab */}
                    {activeTab === 'orders' && (
                        <div className="p-8 md:p-12 space-y-6">
                            {selectedOrderId ? (
                                /* Order Detailed Receipt View */
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setSelectedOrderId(null)}
                                        className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back to Order History</span>
                                    </button>

                                    {loadingOrderDetails ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <Loader size={30} className="animate-spin text-[#d8b66a] mb-4" />
                                            <span className="text-xs uppercase tracking-wider text-[#efe3bf]/60 font-mono">Loading order details...</span>
                                        </div>
                                    ) : selectedOrderDetails ? (
                                        <div className="space-y-6 font-sans text-sm">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#d8b66a]/15 pb-4 gap-2">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-[#efe3bf]/50 font-mono">Order Number</span>
                                                    <h3 className="text-[#efe3bf] font-mono text-lg font-bold mt-0.5">{detailHelpers.saleOrIndentNumber}</h3>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <span className="text-[10px] uppercase tracking-wider text-[#efe3bf]/50 font-mono">Status</span>
                                                    <div className="mt-0.5">
                                                        {(() => {
                                                            const statusLabel = getOrderStatusLabel(selectedOrderDetails.status, selectedOrderDetails.payment_status);
                                                            return (
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${getStatusBadgeStyle(statusLabel.color)}`}>
                                                                    {statusLabel.label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items List inside Order */}
                                            <div className="space-y-4">
                                                <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider">Ordered Items</h4>
                                                <div className="border border-[#d8b66a]/10 rounded-2xl overflow-hidden bg-[#1a2416]/25 divide-y divide-[#d8b66a]/10">
                                                    {detailHelpers.orderItems.map((item, idx) => (
                                                        <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                                                            <div>
                                                                <p className="text-white font-serif font-bold text-sm">{item.product_name}</p>
                                                                <p className="text-[11px] text-[#efe3bf]/50 mt-0.5 font-mono">Weight: {item.weight_label || `${item.weight_grams}g`} • Rate: ₹{Number(item.rate).toFixed(2)}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between sm:justify-end gap-10">
                                                                <div className="text-left sm:text-right">
                                                                    <span className="text-[10px] text-[#efe3bf]/40 uppercase tracking-wider font-mono">Qty</span>
                                                                    <p className="text-white font-mono text-sm font-semibold">{item.quantity}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[10px] text-[#efe3bf]/40 uppercase tracking-wider font-mono">Total</span>
                                                                    <p className="text-[#d8b66a] font-mono text-sm font-bold">₹{Number(item.total_amount).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Calculations Receipt Details */}
                                            <div className="border-t border-[#d8b66a]/10 pt-4 space-y-2.5 max-w-sm ml-auto">
                                                <div className="flex justify-between text-[#efe3bf]/60 text-xs font-mono">
                                                    <span>Taxable Amount</span>
                                                    <span>₹{Number(detailHelpers.taxableAmount).toFixed(2)}</span>
                                                </div>
                                                {Number(detailHelpers.cgstAmount) > 0 && (
                                                    <div className="flex justify-between text-[#efe3bf]/50 text-xs font-mono">
                                                        <span>CGST</span>
                                                        <span>₹{Number(detailHelpers.cgstAmount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {Number(detailHelpers.sgstAmount) > 0 && (
                                                    <div className="flex justify-between text-[#efe3bf]/50 text-xs font-mono">
                                                        <span>SGST</span>
                                                        <span>₹{Number(detailHelpers.sgstAmount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {Number(detailHelpers.igstAmount) > 0 && (
                                                    <div className="flex justify-between text-[#efe3bf]/50 text-xs font-mono">
                                                        <span>IGST</span>
                                                        <span>₹{Number(detailHelpers.igstAmount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {Number(detailHelpers.totalCess) > 0 && (
                                                    <div className="flex justify-between text-[#efe3bf]/50 text-xs font-mono">
                                                        <span>Cess</span>
                                                        <span>₹{Number(detailHelpers.totalCess).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-white font-serif font-bold text-sm border-t border-[#d8b66a]/10 pt-3">
                                                    <span>Grand Total</span>
                                                    <span className="text-[#d8b66a] font-mono font-bold text-base">₹{Number(detailHelpers.grandTotal).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Tracking Stepper */}
                                            <div className="border-t border-[#d8b66a]/10 pt-6 space-y-6">
                                                <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider">Order Status Tracking</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative md:before:content-[''] md:before:absolute md:before:top-[18px] md:before:left-10 md:before:right-10 md:before:h-[2px] md:before:bg-[#d8b66a]/10 z-0">
                                                    {(() => {
                                                        const steps = [
                                                            { label: 'Order Placed', done: true, date: selectedOrderDetails.created_at },
                                                            { label: 'Payment Received', done: selectedOrderDetails.payment_status === 'paid', date: selectedOrderDetails.payment_status === 'paid' ? (selectedOrderDetails.confirmed_at || selectedOrderDetails.created_at) : null },
                                                            { label: 'Confirmed', done: ['confirmed', 'dispatched', 'delivered', 'invoiced'].includes(selectedOrderDetails.status), date: selectedOrderDetails.confirmed_at },
                                                            { label: 'Dispatched', done: ['dispatched', 'delivered', 'invoiced'].includes(selectedOrderDetails.status), date: selectedOrderDetails.dispatched_at },
                                                            { label: 'Delivered', done: ['delivered', 'invoiced'].includes(selectedOrderDetails.status), date: selectedOrderDetails.delivered_at },
                                                        ];

                                                        return steps.map((step, idx) => {
                                                            const stepNumber = idx + 1;
                                                            return (
                                                                <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center relative z-10">
                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-all duration-300 ${step.done
                                                                            ? 'bg-[#d8b66a] border-[#d8b66a] text-[#0b150d] shadow-[0_0_15px_rgba(216,182,106,0.3)]'
                                                                            : 'bg-[#0b150d] border-white/10 text-[#efe3bf]/40'
                                                                        }`}>
                                                                        {step.done ? '✓' : stepNumber}
                                                                    </div>
                                                                    <div className="flex-1 md:flex-none">
                                                                        <div className={`text-xs font-serif font-bold ${step.done ? 'text-white' : 'text-[#efe3bf]/30'}`}>
                                                                            {step.label}
                                                                        </div>
                                                                        {step.done && step.date && (
                                                                            <div className="text-[10px] text-[#efe3bf]/40 font-mono mt-0.5">
                                                                                {formatDate(step.date)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Shipping summary box */}
                                            <div className="border-t border-[#d8b66a]/10 pt-6 space-y-4">
                                                <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider">Delivery Summary</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1a2416]/20 p-5 rounded-2xl border border-[#d8b66a]/5">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-[#efe3bf]/40 uppercase tracking-wider block">Shipping Address</span>
                                                        <p className="text-white text-xs leading-relaxed">{selectedOrderDetails.delivery_address}</p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-[10px] text-[#efe3bf]/40 uppercase tracking-wider block">Payment Method</span>
                                                            <p className="text-white text-xs font-bold uppercase tracking-wider mt-0.5">{selectedOrderDetails.payment_method || 'Cash on Delivery (COD)'}</p>
                                                        </div>
                                                        {selectedOrderDetails.notes && (
                                                            <div>
                                                                <span className="text-[10px] text-[#efe3bf]/40 uppercase tracking-wider block">Customer Notes</span>
                                                                <p className="text-[#efe3bf]/80 text-xs">"{selectedOrderDetails.notes}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tax Invoice Section */}
                                            <div className="border-t border-[#d8b66a]/10 pt-6 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                                        <FileText size={16} className="text-[#d8b66a]" />
                                                        <span>Tax Invoice</span>
                                                    </h4>
                                                    {selectedOrderDetails.is_invoiced || selectedOrderDetails.invoice_id ? (
                                                        <span className="bg-green-500/10 text-green-400 border border-green-500/30 text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-mono">
                                                            Invoice Generated
                                                        </span>
                                                    ) : (
                                                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-mono">
                                                            Invoice Pending Dispatch
                                                        </span>
                                                    )}
                                                </div>

                                                {invoiceDownloadError && (
                                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2 font-mono">
                                                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                                                        <span>{invoiceDownloadError}</span>
                                                    </div>
                                                )}

                                                <div className="bg-[#1a2416]/20 p-5 rounded-2xl border border-[#d8b66a]/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    {selectedOrderDetails.is_invoiced || selectedOrderDetails.invoice_id ? (
                                                        <>
                                                            <div className="space-y-1">
                                                                <p className="text-white text-xs font-semibold">Official Tax Invoice</p>
                                                                <p className="text-[11px] text-[#efe3bf]/50 font-mono">Invoice ID: {selectedOrderDetails.invoice_id || selectedOrderDetails.id}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadInvoice(selectedOrderDetails.invoice_id || selectedOrderDetails.id)}
                                                                disabled={Boolean(downloadingInvoiceId)}
                                                                className="bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-4 py-2.5 rounded-xl transition text-[11px] uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer font-serif disabled:opacity-50"
                                                                style={{ fontFamily: "'Cinzel', serif" }}
                                                            >
                                                                {downloadingInvoiceId === (selectedOrderDetails.invoice_id || selectedOrderDetails.id) ? (
                                                                    <>
                                                                        <Loader size={14} className="animate-spin" />
                                                                        <span>Downloading...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Download size={14} />
                                                                        <span>Download Invoice PDF</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-1 w-full">
                                                            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                                                                <Clock size={14} />
                                                                <span>Invoice Pending Dispatch</span>
                                                            </div>
                                                            <p className="text-[11px] text-[#efe3bf]/60 font-sans leading-relaxed">
                                                                Tax invoice will be generated and made available for download automatically once your order is dispatched.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Feedback & Rating Section */}
                                            <div className="border-t border-[#d8b66a]/10 pt-6 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                                        <Star size={16} className="text-[#d8b66a]" />
                                                        <span>Order Review & Rating</span>
                                                    </h4>
                                                </div>
                                                <div className="bg-[#1a2416]/20 p-5 rounded-2xl border border-[#d8b66a]/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-white text-xs font-semibold">Rate Your Experience</p>
                                                        <p className="text-[11px] text-[#efe3bf]/60 font-sans leading-relaxed">
                                                            Share your thoughts on product quality, packaging, and delivery experience.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeedbackOrder({
                                                            orderId: selectedOrderDetails.id,
                                                            orderNumber: detailHelpers.saleOrIndentNumber
                                                        })}
                                                        className="bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-4 py-2.5 rounded-xl transition text-[11px] uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer font-serif shrink-0 shadow-md"
                                                        style={{ fontFamily: "'Cinzel', serif" }}
                                                    >
                                                        <Star size={14} fill="#0b150d" />
                                                        <span>Rate & Review ⭐</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-red-400 text-xs">
                                            Failed to fetch details for this order. Please try again.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Orders List View */
                                <div className="space-y-4">
                                    {ordersError && (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono">
                                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                                            <span>{ordersError}</span>
                                        </div>
                                    )}

                                    {loadingOrders ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <Loader size={30} className="animate-spin text-[#d8b66a] mb-4" />
                                            <span className="text-xs uppercase tracking-wider text-[#efe3bf]/60 font-mono">Loading your orders...</span>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-16 bg-[#1a2416]/10 border border-dashed border-[#d8b66a]/15 rounded-3xl space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center mx-auto text-[#efe3bf]/40">
                                                <Package size={20} />
                                            </div>
                                            <p className="text-[#efe3bf]/60 text-sm">No orders placed yet.</p>
                                            <a
                                                href="/shop"
                                                className="inline-flex bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-6 py-2.5 rounded-full transition text-[10px] uppercase tracking-widest active:scale-95"
                                            >
                                                Start Shopping
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map(order => (
                                                <div
                                                    key={order.id}
                                                    onClick={() => handleViewOrderDetails(order.id)}
                                                    className="border border-white/5 hover:border-[#d8b66a]/30 bg-[#1a2416]/10 hover:bg-[#1a2416]/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer transition duration-300 gap-4 group"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-sm font-bold text-white">{order.sale_number || order.indent_number}</span>
                                                            {(() => {
                                                                const statusLabel = getOrderStatusLabel(order.status, order.payment_status);
                                                                return (
                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${getStatusBadgeStyle(statusLabel.color)}`}>
                                                                        {statusLabel.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {order.is_invoiced || order.invoice_id ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold bg-[#d8b66a]/10 text-[#d8b66a] border border-[#d8b66a]/30">
                                                                    Invoice Available
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                                    Invoice Pending Dispatch
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#efe3bf]/50 font-mono pt-1">
                                                            <span className="flex items-center gap-1"><Clock size={11} /> {order.created_at ? formatDate(order.created_at) : 'Date N/A'}</span>
                                                            <span>•</span>
                                                            <span>
                                                                {order.totals?.total_quantity !== undefined || order.invoice_lines !== undefined
                                                                    ? `${order.invoice_lines?.reduce((sum, item) => sum + item.quantity, 0) || order.totals?.total_quantity || 0} items`
                                                                    : 'Click to view'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-[#d8b66a]/10 sm:border-0 pt-3 sm:pt-0">
                                                        <div className="text-left sm:text-right">
                                                            <span className="text-[9px] text-[#efe3bf]/40 uppercase tracking-widest block font-mono">Amount</span>
                                                            <span className="text-[#d8b66a] font-mono text-sm font-bold">₹{Number(order.total_amount !== undefined ? order.total_amount : order.totals?.grand_total || 0).toFixed(2)}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFeedbackOrder({
                                                                    orderId: order.id,
                                                                    orderNumber: order.sale_number || order.indent_number
                                                                });
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl bg-[#d8b66a]/10 hover:bg-[#d8b66a] text-[#d8b66a] hover:text-[#0b150d] border border-[#d8b66a]/30 transition text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer font-serif shadow"
                                                            style={{ fontFamily: "'Cinzel', serif" }}
                                                            title="Rate and review this order"
                                                        >
                                                            <Star size={12} />
                                                            <span>Rate</span>
                                                        </button>
                                                        <div className="w-8 h-8 rounded-full bg-[#0b150d] border border-white/5 group-hover:border-[#d8b66a]/30 text-[#d8b66a] flex items-center justify-center transition duration-300">
                                                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                        <div className="p-8 md:p-12 space-y-6">
                            {/* Success and Error messages */}
                            <AnimatePresence mode="wait">
                                {addressSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-xs flex items-center gap-3 font-mono"
                                    >
                                        <Check size={16} className="text-green-400 shrink-0" />
                                        <span>{addressSuccess}</span>
                                    </motion.div>
                                )}
                                {addressError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono"
                                    >
                                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                                        <span>{addressError}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {addressFormOpen ? (
                                /* Add / Edit Address Form */
                                <div className="bg-[#1a2416]/20 p-6 rounded-3xl border border-[#d8b66a]/10 space-y-6 font-sans">
                                    <h3 className="font-serif text-lg text-white font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                                    </h3>
                                    <form onSubmit={handleAddressSubmit} className="space-y-4 text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="name"
                                                    value={addressFormData.name}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="Recipient's Full Name"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    name="phone"
                                                    value={addressFormData.phone}
                                                    onChange={e => handleAddressInputChange({ target: { name: 'phone', value: e.target.value.replace(/\D/g, '') } })}
                                                    placeholder="10-digit mobile number"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Address Line 1 *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="address_line_1"
                                                    value={addressFormData.address_line_1}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="House/Flat No., Street, Area"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Address Line 2 (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="address_line_2"
                                                    value={addressFormData.address_line_2}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="Apartment, Suite, Unit, etc."
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1 col-span-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">City *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="city"
                                                    value={addressFormData.city}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="City"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1 col-span-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">State *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="state"
                                                    value={addressFormData.state}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="State"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1 col-span-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">PIN Code *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="postal_code"
                                                    value={addressFormData.postal_code}
                                                    onChange={e => handleAddressInputChange({ target: { name: 'postal_code', value: e.target.value.replace(/\D/g, '') } })}
                                                    placeholder="6-digit pincode"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1 col-span-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Country *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    name="country"
                                                    value={addressFormData.country}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="Country"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-[#d8b66a] font-mono">Landmark (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="landmark"
                                                    value={addressFormData.landmark}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="Near Metro Station"
                                                    className="w-full bg-[#11180f]/50 text-white border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 focus:border-[#d8b66a] outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 py-2">
                                            <input
                                                type="checkbox"
                                                id="is_default"
                                                name="is_default"
                                                checked={addressFormData.is_default}
                                                onChange={handleAddressInputChange}
                                                disabled={addresses.length === 0}
                                                className="w-4 h-4 accent-[#d8b66a] cursor-pointer"
                                            />
                                            <label htmlFor="is_default" className="text-xs text-[#efe3bf]/85 cursor-pointer select-none">
                                                Set as default delivery address
                                            </label>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-[#d8b66a]/5">
                                            <button
                                                type="button"
                                                onClick={closeAddressForm}
                                                className="flex-1 border border-white/10 hover:border-white/20 text-[#efe3bf]/85 hover:text-white font-bold py-3.5 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[10px] cursor-pointer"
                                                style={{ fontFamily: "'Cinzel', serif" }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold py-3.5 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[10px] shadow-lg shadow-[#d8b66a]/5 flex items-center justify-center gap-2 cursor-pointer"
                                                style={{ fontFamily: "'Cinzel', serif" }}
                                            >
                                                <span>Save Address</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                /* Address List View */
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-serif text-sm text-[#efe3bf]/75 tracking-wider uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Saved Shipping Addresses
                                        </h3>
                                        <button
                                            onClick={openAddAddressForm}
                                            className="bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold py-2.5 px-4 rounded-full transition text-[10px] uppercase tracking-widest active:scale-95 flex items-center gap-1.5 cursor-pointer font-serif animate-none"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            <Plus size={13} strokeWidth={2.5} />
                                            <span>Add New Address</span>
                                        </button>
                                    </div>

                                    {loadingAddresses ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <Loader size={30} className="animate-spin text-[#d8b66a] mb-4" />
                                            <span className="text-xs uppercase tracking-wider text-[#efe3bf]/60 font-mono">Loading addresses...</span>
                                        </div>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-16 bg-[#1a2416]/10 border border-dashed border-[#d8b66a]/15 rounded-3xl space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center mx-auto text-[#efe3bf]/40">
                                                <MapPin size={20} />
                                            </div>
                                            <p className="text-[#efe3bf]/60 text-sm">No addresses saved yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    className={`border rounded-3xl p-5 flex flex-col justify-between transition duration-300 bg-[#1a2416]/10 relative group ${addr.is_default
                                                            ? 'border-[#d8b66a] shadow-[0_4px_20px_rgba(216,182,106,0.05)]'
                                                            : 'border-white/5 hover:border-[#d8b66a]/20'
                                                        }`}
                                                >
                                                    <div className="space-y-3 font-sans text-xs">
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-serif font-bold text-sm text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                                                                {addr.name || (user.first_name || user.last_name
                                                                    ? `${user.first_name} ${user.last_name}`.trim()
                                                                    : 'Customer'
                                                                )}
                                                            </span>
                                                            {addr.is_default && (
                                                                <span className="bg-[#d8b66a]/10 border border-[#d8b66a]/30 text-[#d8b66a] font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[#efe3bf]/85 space-y-1 font-light leading-relaxed">
                                                            <p>{addr.address_line_1}</p>
                                                            {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                                                            {addr.landmark && <p className="text-[#efe3bf]/50">Landmark: {addr.landmark}</p>}
                                                            <p>{addr.city}, {addr.state} - {addr.postal_code}, {addr.country || 'India'}</p>
                                                            <p className="pt-2 text-[#efe3bf]/60 font-mono text-[11px]">Phone: {addr.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 border-t border-[#d8b66a]/5 pt-4 mt-5">
                                                        <button
                                                            onClick={() => handleEditAddressClick(addr)}
                                                            className="flex-1 bg-[#1a2416] hover:bg-[#234130] text-[#d8b66a] font-bold py-2 rounded-xl uppercase tracking-wider transition text-[10px] flex items-center justify-center gap-1.5 cursor-pointer font-serif border border-[#d8b66a]/10"
                                                            style={{ fontFamily: "'Cinzel', serif" }}
                                                        >
                                                            <Edit2 size={11} />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddressClick(addr.id)}
                                                            className="flex-1 bg-red-950/20 hover:bg-red-950/50 text-red-400 font-bold py-2 rounded-xl uppercase tracking-wider transition text-[10px] flex items-center justify-center gap-1.5 cursor-pointer font-serif border border-red-500/10"
                                                            style={{ fontFamily: "'Cinzel', serif" }}
                                                        >
                                                            <Trash2 size={11} />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </motion.div>

            </div>

            {/* Order Feedback Modal */}
            {feedbackOrder && (
                <OrderFeedbackModal
                    orderId={feedbackOrder.orderId}
                    orderNumber={feedbackOrder.orderNumber}
                    onClose={() => setFeedbackOrder(null)}
                    onSuccess={() => {
                        setFeedbackOrder(null);
                        loadOrders();
                    }}
                />
            )}
        </main>
    );
}

