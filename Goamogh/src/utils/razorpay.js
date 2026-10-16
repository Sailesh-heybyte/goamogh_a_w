const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

// Loads Razorpay Checkout once. Resolves true when ready, false if it failed to load.
export function loadRazorpayScript() {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve(Boolean(window.Razorpay));
        script.onerror = () => {
            script.remove();
            scriptPromise = null;
            resolve(false);
        };
        document.body.appendChild(script);
    });
    return scriptPromise;
}

// Opens the Razorpay popup. All values come from our backend's /pay/initiate response.
// onSuccess(response): response has razorpay_payment_id, razorpay_order_id, razorpay_signature
// onFailed(error): Razorpay's error object (code, description, reason, metadata)
// onDismiss(): customer closed the popup
export function openRazorpayCheckout({ keyId, orderId, amountPaise, currency, description, prefill, onSuccess, onFailed, onDismiss }) {
    const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount: amountPaise,
        currency,
        name: 'Go Amogh',
        description,
        prefill,
        theme: { color: '#d8b66a' },
        handler: onSuccess,
        modal: { ondismiss: onDismiss },
    });
    rzp.on('payment.failed', (response) => onFailed(response.error));
    rzp.open();
}
