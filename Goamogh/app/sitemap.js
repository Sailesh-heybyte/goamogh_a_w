export default async function sitemap() {
    const baseUrl = 'https://goamogh.com';

    const routes = ['', '/about', '/heritage', '/recipes', '/shop', '/certificates'];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString().split('T')[0],
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
    }));
}
