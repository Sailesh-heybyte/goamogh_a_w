import { API_PREFIX, handleResponse, apiFetch } from './apiClient';

export async function fetchOrderHistory(token) {
    const response = await apiFetch(`${API_PREFIX}/orders`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function fetchOrderDetails(token, orderId) {
    const response = await apiFetch(`${API_PREFIX}/orders/${orderId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function submitOrderFeedback(token, orderId, { rating, comments }) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiFetch(`${API_PREFIX}/orders/${orderId}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating, comments }),
    });
    return handleResponse(response);
}
