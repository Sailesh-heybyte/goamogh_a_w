import { API_PREFIX, handleResponse, apiFetch } from './apiClient';

export async function sendOtp(phone) {
    const response = await apiFetch(`${API_PREFIX}/auth/otp/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
    });
    return handleResponse(response);
}

export async function verifyOtp(phone, otp_code) {
    const response = await apiFetch(`${API_PREFIX}/auth/otp/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp_code }),
    });
    return handleResponse(response);
}

export async function refreshAuthToken(refresh_token) {
    const response = await apiFetch(`${API_PREFIX}/auth/refresh-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token }),
    });
    return handleResponse(response);
}

export async function fetchUserProfile(token) {
    const response = await apiFetch(`${API_PREFIX}/user/profile`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
}

export async function updateUserProfile(token, profileData) {
    const response = await apiFetch(`${API_PREFIX}/user/profile`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
    });
    return handleResponse(response);
}

export async function logoutUser(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await apiFetch(`${API_PREFIX}/auth/logout`, {
        method: 'POST',
        headers,
    });
    return handleResponse(response);
}
