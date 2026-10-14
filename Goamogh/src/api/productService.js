import { API_PREFIX, handleResponse, API_BASE, apiFetch } from './apiClient';


export async function fetchCategories(activeOnly = true) {
    const response = await apiFetch(`${API_PREFIX}/inventory/categories?active_only=${activeOnly}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}

let categoriesPromise = null;
export const getCategoriesOnce = () => {
    if (!categoriesPromise) {
        categoriesPromise = fetchCategories().catch((err) => {
            categoriesPromise = null;
            throw err;
        });
    }
    return categoriesPromise;
};



export async function fetchProducts(params = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('is_sellable', 'true');
    queryParams.append('active_only', 'true');

    if (params.search) {
        queryParams.append('search', params.search);
    }
    if (params.category_id) {
        queryParams.append('category_id', params.category_id);
    }
    if (params.skip !== undefined) {
        queryParams.append('skip', params.skip.toString());
    }
    if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_PREFIX}/inventory/items${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}


export async function fetchProductDetails(productId) {
    const response = await apiFetch(`${API_PREFIX}/inventory/items/${productId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}


export async function fetchProductVariants(productId) {
    const response = await apiFetch(`${API_PREFIX}/inventory/items/${productId}/variants`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return handleResponse(response);
}


