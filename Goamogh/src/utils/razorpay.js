const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

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

export function openRazorpayCheckout({
    keyId,
    orderId,
    amountPaise,
    currency,
    description,
    prefill,
    onSuccess,
    onFailed,
    onDismiss,
}) {
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
