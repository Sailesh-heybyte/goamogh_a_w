const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_PREFIX = `${API_BASE}/api/v1`;

function getSafeErrorMessage(status, rawMsg, errorData) {
    const lowerMsg = (rawMsg || '').toLowerCase();
    const isTechnicalError =
        lowerMsg.includes('sql') ||
        lowerMsg.includes('traceback') ||
        lowerMsg.includes('exception') ||
        lowerMsg.includes('database') ||
        lowerMsg.includes('syntaxerror') ||
        lowerMsg.includes('internal server') ||
        lowerMsg.includes('http error!') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('object object') ||
        lowerMsg.includes('column') ||
        lowerMsg.includes('table') ||
        lowerMsg.includes('foreign key') ||
        lowerMsg.includes('unique constraint');

    if (status === 409 && rawMsg && !isTechnicalError) {
        return rawMsg;
    }

    if ((status === 400 || status === 422) && rawMsg && !isTechnicalError && rawMsg.length < 150) {
        return rawMsg;
    }

    switch (status) {
        case 400:
            return 'Please check the information entered.';
        case 401:
            return 'Your session expired. Please sign in again.';
        case 403:
            return 'You do not have permission.';
        case 404:
            return 'Requested information could not be found.';
        case 409:
            return 'Something changed. Please refresh and try again.';
        case 422:
            return 'Please correct the highlighted fields.';
        case 429:
            return 'Too many attempts. Try again shortly.';
        case 500:
        case 502:
        case 503:
        case 504:
            return 'Something went wrong. Please try again.';
        default:
            if (isTechnicalError || !rawMsg) {
                return 'Something went wrong. Please try again.';
            }
            return rawMsg;
    }
}

async function handleResponse(response) {
    if (!response.ok) {
        let errorData = null;
        try {
            errorData = await response.json();
        } catch (e) {}

        let rawMsg = '';
        if (errorData?.detail) {
            if (typeof errorData.detail === 'string') {
                rawMsg = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
                rawMsg = errorData.detail.map((err) => err.msg).join(', ');
            } else {
                rawMsg = JSON.stringify(errorData.detail);
            }
        } else if (errorData?.message) {
            rawMsg = errorData.message;
        }

        const safeMsg = getSafeErrorMessage(response.status, rawMsg, errorData);
        const err = new Error(safeMsg);
        err.status = response.status;
        err.data = errorData;
        err.rawMessage = rawMsg;
        throw err;
    }
    return await response.json();
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(null, token));
    refreshSubscribers = [];
}

function onRefreshFailed(error) {
    refreshSubscribers.forEach((cb) => cb(error, null));
    refreshSubscribers = [];
}

async function apiFetch(url, options = {}) {
    let token = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('goamogh_access_token');
    }

    options.headers = options.headers || {};
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, options);
    } catch (err) {
        throw err;
    }

    const isAuthEndpoint =
        url.includes('/auth/otp/send') || url.includes('/auth/otp/verify') || url.includes('/auth/refresh-token');

    if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
        if (typeof window === 'undefined') {
            return response;
        }

        const refreshToken = localStorage.getItem('goamogh_refresh_token');
        if (!refreshToken) {
            window.dispatchEvent(
                new CustomEvent('goamogh-auth-error', {
                    detail: { message: 'Session expired. Please log in again.' },
                })
            );
            return response;
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((error, newToken) => {
                    if (error) {
                        reject(error);
                    } else {
                        options.headers['Authorization'] = `Bearer ${newToken}`;
                        options._isRetry = true;
                        resolve(fetch(url, options));
                    }
                });
            });
        }

        isRefreshing = true;
        options._isRetry = true;

        try {
            const refreshResponse = await fetch(`${API_PREFIX}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (refreshResponse.ok) {
                const result = await refreshResponse.json();
                if (result.success && result.data) {
                    const newAccessToken = result.data.access_token;
                    const newRefreshToken = result.data.refresh_token;

                    localStorage.setItem('goamogh_access_token', newAccessToken);
                    localStorage.setItem('goamogh_refresh_token', newRefreshToken);

                    onRefreshed(newAccessToken);
                    isRefreshing = false;

                    window.dispatchEvent(
                        new CustomEvent('goamogh-token-refreshed', {
                            detail: {
                                accessToken: newAccessToken,
                                refreshToken: newRefreshToken,
                            },
                        })
                    );

                    options.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return await fetch(url, options);
                }
            }

            isRefreshing = false;
            onRefreshFailed(new Error('Session expired. Please log in again.'));
            localStorage.removeItem('goamogh_access_token');
            localStorage.removeItem('goamogh_refresh_token');
            localStorage.removeItem('goamogh_user');

            window.dispatchEvent(
                new CustomEvent('goamogh-auth-error', {
                    detail: { message: 'Session expired. Please log in again.' },
                })
            );

            return response;
        } catch (refreshErr) {
            isRefreshing = false;
            const networkError = new Error("Can't reach the server. Please check your connection and retry.");
            onRefreshFailed(networkError);
            throw networkError;
        }
    }

    return response;
}

export { API_BASE, API_PREFIX, handleResponse, apiFetch, getSafeErrorMessage };
