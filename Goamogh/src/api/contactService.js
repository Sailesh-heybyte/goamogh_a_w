import { API_PREFIX, handleResponse, apiFetch } from './apiClient';


export async function submitContactEnquiry(payload) {
    const response = await apiFetch(`${API_PREFIX}/contact/enquiry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            inquiry_topic: payload.inquiry_topic,
            message: payload.message,
            terms_accepted: payload.terms_accepted
        }),
    });
    return handleResponse(response);
}


