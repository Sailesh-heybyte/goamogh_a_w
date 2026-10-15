import { API_PREFIX, handleResponse, apiFetch } from './apiClient';

export async function fetchCertificates() {
    const response = await apiFetch(`${API_PREFIX}/certificates`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}

let certificatesPromise = null;

export const clearCertificatesCache = () => {
    certificatesPromise = null;
};

export const getCertificatesOnce = () => {
    if (!certificatesPromise) {
        certificatesPromise = fetchCertificates().catch((err) => {
            certificatesPromise = null;
            throw err;
        });
    }
    return certificatesPromise;
};
