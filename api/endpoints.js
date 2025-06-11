// API Base URL
const BASE_URL = 'http://localhost:3000/api';

// API Endpoints Configuration
const API = {
  // Authentication
  auth: {
    register: `${BASE_URL}/users/register`,
    login: `${BASE_URL}/users/login`,
    registerAdmin: `${BASE_URL}/users/register-admin`,
  },

  // User Management
  users: {
    profile: `${BASE_URL}/users`,
    updateProfile: `${BASE_URL}/users`,
    getUserCount: `${BASE_URL}/users/count`,
  },

  // User Features
  userFeatures: {
    // Address Management
    addAddress: `${BASE_URL}/user-features/addresses`,
    getAddresses: (userId) => `${BASE_URL}/user-features/addresses/${userId}`,
    setDefaultAddress: (userId) => `${BASE_URL}/user-features/addresses/default/${userId}`,

    // UPI Methods
    addUpiMethod: `${BASE_URL}/user-features/upi-methods`,
    getUpiMethods: (userId) => `${BASE_URL}/user-features/upi-methods/${userId}`,
    setDefaultUpiMethod: (userId) => `${BASE_URL}/user-features/upi-methods/default/${userId}`,
  },

  // Products
  products: {
    getAll: `${BASE_URL}/products`,
    getById: (id) => `${BASE_URL}/products/${id}`,
    search: `${BASE_URL}/products/search`,
    getFeatured: (count) => `${BASE_URL}/products/get/Featured/${count}`,
    getCount: `${BASE_URL}/products/get/count`,
  },

  // Categories
  categories: {
    getAll: `${BASE_URL}/category`,
    getById: (id) => `${BASE_URL}/category/${id}`,
  },

  // Cart
  cart: {
    getCart: (userId) => `${BASE_URL}/cart/${userId}`,
    addToCart: `${BASE_URL}/cart`,
    updateCart: (userId) => `${BASE_URL}/cart/${userId}`,
    removeFromCart: (userId) => `${BASE_URL}/cart/${userId}`,
    clearCart: (userId) => `${BASE_URL}/cart/clear/${userId}`,
  },

  // Orders
  orders: {
    // Admin Routes
    getAll: `${BASE_URL}/orders`,
    getById: (id) => `${BASE_URL}/orders/${id}`,
    updateStatus: (id) => `${BASE_URL}/orders/${id}`,
    deleteOrder: (id) => `${BASE_URL}/orders/${id}`,
    getTotalSales: `${BASE_URL}/orders/get/totalsales`,
    getOrderCount: `${BASE_URL}/orders/get/count`,

    // User Routes
    getUserOrders: (userId) => `${BASE_URL}/orders/user/${userId}`,
  },

  // Purchases
  purchases: {
    directPurchase: (userId) => `${BASE_URL}/purchase/direct/${userId}`,
    cartPurchase: (userId) => `${BASE_URL}/purchase/cart/${userId}`,
  },

  // UPI Payments
  upiPayments: {
    getSupportedApps: `${BASE_URL}/upi-payments/supported-apps`,
    processPayment: (orderId) => `${BASE_URL}/upi-payments/process/${orderId}`,
    getPaymentStatus: (orderId) => `${BASE_URL}/upi-payments/status/${orderId}`,
    getPaymentHistory: (userId) => `${BASE_URL}/upi-payments/history/${userId}`,
  },
};

// Example API request functions
const apiService = {
  // Generic request function
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  },

  // Authentication
  async login(credentials) {
    return this.request(API.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData) {
    return this.request(API.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Products
  async getProducts() {
    return this.request(API.products.getAll);
  },

  async getProductById(id) {
    return this.request(API.products.getById(id));
  },

  async searchProducts(query) {
    return this.request(`${API.products.search}?${new URLSearchParams(query)}`);
  },

  // Cart
  async getCart(userId) {
    return this.request(API.cart.getCart(userId));
  },

  async addToCart(cartData) {
    return this.request(API.cart.addToCart, {
      method: 'POST',
      body: JSON.stringify(cartData),
    });
  },

  // Orders
  async createOrder(orderData) {
    return this.request(API.purchases.directPurchase(orderData.userId), {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getUserOrders(userId) {
    return this.request(API.orders.getUserOrders(userId));
  },

  // UPI Payments
  async processUpiPayment(orderId, paymentData) {
    return this.request(API.upiPayments.processPayment(orderId), {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  async getPaymentStatus(orderId) {
    return this.request(API.upiPayments.getPaymentStatus(orderId));
  },
};

// Example usage:
/*
// Login
const login = async () => {
  try {
    const response = await apiService.login({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('Login successful:', response);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get Products
const getProducts = async () => {
  try {
    const products = await apiService.getProducts();
    console.log('Products:', products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};

// Create Order
const createOrder = async () => {
  try {
    const orderData = {
      userId: 'user123',
      productId: 'product123',
      quantity: 1,
      shippingAddress: '123 Main St',
      city: 'Mumbai',
      zip: '400001',
      phone: '9876543210'
    };
    const order = await apiService.createOrder(orderData);
    console.log('Order created:', order);
  } catch (error) {
    console.error('Failed to create order:', error);
  }
};
*/

export { API, apiService }; 