import { API_PREFIX, handleResponse, apiFetch } from './apiClient';

export async function fetchDbCart(token) {
    const response = await apiFetch(`${API_PREFIX}/cart`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function addToDbCart(token, variantOrItem, quantity = 1) {
    let variant_id = '';
    let qty = quantity;

    if (typeof variantOrItem === 'object' && variantOrItem !== null) {
        variant_id = variantOrItem.id;
        qty = variantOrItem.quantity || 1;
    } else {
        variant_id = variantOrItem;
    }

    const response = await apiFetch(`${API_PREFIX}/cart/items`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variant_id, quantity: qty }),
    });
    return handleResponse(response);
}

export async function removeFromDbCart(token, itemId) {
    const response = await apiFetch(`${API_PREFIX}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function updateDbCartQty(token, itemId, quantity) {
    const response = await apiFetch(`${API_PREFIX}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
}

export async function clearDbCart(token) {
    const response = await apiFetch(`${API_PREFIX}/cart/clear`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function checkoutCart(token, checkoutData) {
    const response = await apiFetch(`${API_PREFIX}/cart/checkout`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
    });

    return handleResponse(response);
}

export async function fetchAddresses(token) {
    const response = await apiFetch(`${API_PREFIX}/user/addresses`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function createAddress(token, addressData) {
    const response = await apiFetch(`${API_PREFIX}/user/addresses`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
    });
    return handleResponse(response);
}

export async function deleteAddress(token, addressId) {
    const response = await apiFetch(`${API_PREFIX}/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function updateAddress(token, addressId, addressData) {
    const response = await apiFetch(`${API_PREFIX}/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
    });
    return handleResponse(response);
}
