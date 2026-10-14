let rawBaseUrl = import.meta.env.VITE_API_URL || ""
if (rawBaseUrl.endsWith("/")) rawBaseUrl = rawBaseUrl.slice(0, -1)
if (rawBaseUrl.endsWith("/api/v1")) rawBaseUrl = rawBaseUrl.replace(/\/api\/v1$/, "")
const BASE_URL = rawBaseUrl

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(null, token))
  refreshSubscribers = []
}

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(error, null))
  refreshSubscribers = []
}

export const customFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${BASE_URL}${cleanEndpoint}`

  const accessToken = localStorage.getItem("access_token") || localStorage.getItem("admin_token")

  // Ensure cookies are always sent with credentials
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (accessToken) {
    options.headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(url, options)

  // Check if the response is unauthorized
  if (
    response.status === 401 &&
    !options._isRetry &&
    !endpoint.includes("/auth/refresh-token") &&
    !endpoint.includes("/auth/login")
  ) {
    const retryPromise = new Promise((resolve, reject) => {
      subscribeTokenRefresh((error, token) => {
        if (error) {
          reject(error)
        } else {
          if (token && options.headers) {
            options.headers["Authorization"] = `Bearer ${token}`
          }
          resolve(customFetch(endpoint, { ...options, _isRetry: true }))
        }
      })
    })

    if (!isRefreshing) {
      const runRefresh = async () => {
        const refreshToken = localStorage.getItem("refresh_token")
        if (!refreshToken) {
          isRefreshing = false
          const error = new Error("No refresh token available")
          onRefreshFailed(error)
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          if (window.location.pathname !== "/login") {
            window.location.href = "/login"
          }
          return
        }

        try {
          const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json()
            let newAccessToken = null
            if (refreshData.success && refreshData.data) {
              newAccessToken = refreshData.data.access_token
              localStorage.setItem("access_token", newAccessToken)
              if (refreshData.data.refresh_token) {
                localStorage.setItem("refresh_token", refreshData.data.refresh_token)
              }
            }
            isRefreshing = false
            onRefreshed(newAccessToken)
          } else {
            isRefreshing = false
            const error = new Error("Session expired")
            onRefreshFailed(error)
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            if (window.location.pathname !== "/login") {
              window.location.href = "/login"
            }
          }
        } catch {
          isRefreshing = false
          const error = new Error("Can't reach the server. Please check your connection and retry.")
          onRefreshFailed(error)
        }
      }
      isRefreshing = true
      runRefresh()
    }

    return retryPromise
  }

  // Check if the response is HTTP 429 (Too Many Requests / Rate Limited)
  if (response.status === 429) {
    try {
      const cloned = response.clone()
      cloned.json().then((data) => {
        const message =
          data?.detail ||
          data?.message ||
          "Too many requests. Please wait 1 minute before requesting another code."
        window.dispatchEvent(
          new CustomEvent("api:rate-limit", {
            detail: { message, status: 429, data },
          })
        )
      }).catch(() => {
        window.dispatchEvent(
          new CustomEvent("api:rate-limit", {
            detail: {
              message: "Too many requests. Please wait 1 minute before requesting another code.",
              status: 429,
            },
          })
        )
      })
    } catch {
      // Fallback
    }
  }

  return response
}

/**
 * Helper utility to parse API response errors standardizing HTTP 429 Rate Limit messages.
 * @param {Response} response
 * @returns {Promise<{ status: number, isRateLimit: boolean, message: string, detail?: string }>}
 */
export const parseApiResponseError = async (response) => {
  let json
  try {
    json = await response.json()
  } catch {
    json = {}
  }

  const isRateLimit = response.status === 429
  const defaultMsg = isRateLimit
    ? "Too many OTP requests. Please wait 1 minute before requesting another code."
    : "An unexpected error occurred. Please try again."

  const message = json.detail || json.message || json.error || defaultMsg

  return {
    status: response.status,
    isRateLimit,
    message,
    detail: json.detail,
    data: json,
  }
}


