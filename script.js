async function fetchProducts() {
    try {
        const { data } = await supabase
            .from('products')
            .select('*'); // Selecting all columns

        renderProducts(data);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function renderProducts(products) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // Clear existing products

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');
        productDiv.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p>Price: ${product.price_small}</p>
            <p>Category: ${product.category}</p>
            <p>Unit (Small): ${product.unit_small}</p>
            <p>Unit (Bulk): ${product.unit_bulk}</p>
            <p>Price (Bulk): ${product.price_bulk}</p>
        `;
        productContainer.appendChild(productDiv);
    });
}