function fetchProducts() {
    return supabase
        .from('products')
        .select('*');
}