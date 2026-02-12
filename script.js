// script.js

function fetchProductData() {
    // Fetch product data from API
    fetch('https://api.example.com/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Check for product data availability
            if (!data || !Array.isArray(data.products)) {
                throw new Error('Product data is not in expected format');
            }
            data.products.forEach(product => {
                // Add null safety checks
                const price = product.price !== null ? product.price : 'N/A';
                const image = product.image || 'default-image.png';
                displayProduct(product.name, price, image);
            });
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            alert('Failed to load product data. Please try again later.');
        });
}

function displayProduct(name, price, image) {
    // Function to display product details on the webpage
    const productElement = document.createElement('div');
    productElement.innerHTML = `<h2>${name}</h2><p>Price: ${price}</p><img src='${image}' alt='${name}'>`;
    document.body.appendChild(productElement);
}

fetchProductData();