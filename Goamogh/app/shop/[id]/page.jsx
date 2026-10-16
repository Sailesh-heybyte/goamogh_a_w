import ProductDetailPage from '../../../src/screens/ProductDetailPage';

export const metadata = {
    title: 'Product Details | Goamogh',
    description: 'Learn more about this hand-pounded premium spice and single-origin blend by Goamogh.',
};

export default function ShopProductDetailPage({ params }) {
    const { id } = params;
    return <ProductDetailPage id={id} />;
}
