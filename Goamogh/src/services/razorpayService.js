

export function loadRazorpaySDK() {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const existingScript = document.getElementById('razorpay-checkout-sdk');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => resolve(false));
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-checkout-sdk';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.body.appendChild(script);
    });
}


export function openRazorpayCheckout({
    keyId,
    razorpayOrderId,
    amountInPaise,
    currency = 'INR',
    businessName = 'Goamogh',
    description = 'Artisan Spices & Blends',
    customer = {},
    onSuccess,
    onDismiss,
    onError
}) {
    if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay SDK is not loaded. Call loadRazorpaySDK() first.');
    }

    const publicRazorpayKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!publicRazorpayKey || publicRazorpayKey.includes('YOUR_KEY_ID') || publicRazorpayKey === 'rzp_test_YOUR_KEY_ID') {
        throw new Error('Razorpay Key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local.');
    }

    const options = {
        key: publicRazorpayKey,
        amount: amountInPaise,
        currency: currency,
        name: businessName,
        description: description,
        handler: function (response) {
            if (typeof onSuccess === 'function') {
                onSuccess({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });
            }
        },
        prefill: {
            name: customer.name || '',
            email: customer.email || '',
            contact: customer.contact || customer.phone || ''
        },
        notes: {
            platform: 'Goamogh E-Commerce Web'
        },
        theme: {
            color: '#d8b66a', // Matches Goamogh gold branding
            backdrop_color: '#0b150d'
        },
        modal: {
            ondismiss: function () {
                if (typeof onDismiss === 'function') {
                    onDismiss();
                }
            }
        }
    };

    if (razorpayOrderId && typeof razorpayOrderId === 'string' && razorpayOrderId.trim()) {
        options.order_id = razorpayOrderId.trim();
    }

    const rzp = new window.Razorpay(options);

    if (typeof onError === 'function') {
        rzp.on('payment.failed', function (response) {
            onError(response.error);
        });
    }

    rzp.open();
    return rzp;
}

