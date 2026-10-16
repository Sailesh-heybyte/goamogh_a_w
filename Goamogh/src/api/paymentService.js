import { API_PREFIX, handleResponse, apiFetch } from './apiClient';

export async function initiatePayment(token, saleId) {
    const response = await apiFetch(`${API_PREFIX}/orders/${saleId}/pay/initiate`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function verifyPayment(token, saleId, rzpResponse) {
    const response = await apiFetch(`${API_PREFIX}/orders/${saleId}/pay/verify`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature,
        }),
    });
    return handleResponse(response);
}

export async function fetchPaymentStatus(token, saleId) {
    const response = await apiFetch(`${API_PREFIX}/orders/${saleId}/pay/status`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}
