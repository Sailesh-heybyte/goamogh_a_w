import '../src/index.css';
import { Playfair_Display } from 'next/font/google';
import Header from '../src/components/layout/Header';
import Footer from '../src/components/layout/Footer';
import LenisProvider from '../src/components/layout/LenisProvider';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import LoginModal from '../src/components/modals/LoginModal';
import LegalModal from '../src/components/modals/LegalModal';

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-playfair',
});

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata = {
    metadataBase: new URL('https://goamogh.com'),
    title: {
        default: 'Goamogh | Premium Spices and Blends',
        template: '%s | Goamogh',
    },
    description:
        'Goamogh offers premium, artisan spices and hand-pounded blends crafted to elevate modern home cooking.',
    keywords: ['spices', 'artisan blends', 'hand-pounded spices', 'premium food', 'cooking ingredients', 'Goamogh'],
    openGraph: {
        title: 'Goamogh | Premium Spices and Blends',
        description:
            'Goamogh offers premium, artisan spices and hand-pounded blends crafted to elevate modern home cooking.',
        url: 'https://goamogh.com',
        siteName: 'Goamogh',
        locale: 'en_US',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Goamogh',
        url: 'https://goamogh.com',
        logo: 'https://goamogh.com/brand/goamogh-golden.png',
        description:
            'Goamogh offers premium, artisan spices and hand-pounded blends crafted to elevate modern home cooking.',
        sameAs: [
            'https://www.instagram.com/goamogh',
            'https://www.facebook.com/share/1FCXxkVonj/',
            'https://www.youtube.com/@goamogh',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
        },
    };

    return (
        <html lang="en" className={playfair.variable}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&display=swap"
                />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            </head>
            <body className="theme-goamogh bg-[#1a2416] min-h-screen text-[#efe3bf] selection:bg-[#d6b56b] selection:text-[#1a2416] font-sans">
                <AuthProvider>
                    <CartProvider>
                        <LenisProvider>
                            <Header />
                            <LoginModal />
                            <LegalModal />
                            {children}
                            <Footer />
                        </LenisProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
