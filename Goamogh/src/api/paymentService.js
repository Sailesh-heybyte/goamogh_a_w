import { API_PREFIX, handleResponse, apiFetch } from './apiClient';


export async function initiatePayment(token, orderId) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiFetch(`${API_PREFIX}/orders/${orderId}/pay/initiate`, {
        method: 'POST',
        headers
    });
    return handleResponse(response);
}


