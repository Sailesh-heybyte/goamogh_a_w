import { API_PREFIX, handleResponse, apiFetch } from './apiClient';


export async function fetchOrderHistory(token, skip = 0, limit = 50) {
    const response = await apiFetch(`${API_PREFIX}/orders?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}


export async function fetchOrderDetails(token, orderId) {
    const response = await apiFetch(`${API_PREFIX}/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}


export async function downloadInvoicePdf(token, invoiceId) {
    const response = await apiFetch(`${API_PREFIX}/sales/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        let errMessage = 'Failed to download invoice PDF';
        try {
            const errData = await response.json();
            errMessage = errData.detail || errData.message || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
    }

    return response.blob();
}


export async function submitOrderFeedback(token, orderId, { rating, comments }) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiFetch(`${API_PREFIX}/orders/${orderId}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating, comments })
    });
    return handleResponse(response);
}


