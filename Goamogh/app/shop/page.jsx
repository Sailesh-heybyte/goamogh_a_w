import { Suspense } from 'react';
import ShopPage from '../../src/screens/ShopPage'

export const metadata = {
  title: 'Shop Premium Spices & Blends Online',
  description: 'Buy premium, hand-harvested Black Pepper, Cardamom, Cumin Powder, and custom spice blends. Sourced directly from the finest farms for peak aroma and flavor.',
}

export default function ShopRoute() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#1a2416] flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#d8b66a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#efe3bf]/70 font-mono text-sm tracking-widest uppercase">Loading Shop...</p>
        </div>
      </main>
    }>
      <ShopPage />
    </Suspense>
  );
}

