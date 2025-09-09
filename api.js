// API endpoint exports for frontend use
// Base URL (change if needed)
export const BASE_URL = 'http://localhost:5000/api';

// User Authentication & Profile
export const REGISTER_USER_API = '/users/register';
export const REGISTER_ADMIN_API = '/users/register-admin';
export const LOGIN_API = '/users/login';
export const USER_PROFILE_API = '/users';
export const USER_UPDATE_PROFILE_API = '/users';
export const USER_COUNT_API = '/users/count';

// Admin User Management
export const ADMIN_USERS_API = '/users/admin';
export const ADMIN_USER_BY_ID_API = (id) => `/users/admin/${id}`;
export const ADMIN_DELETE_USER_API = (id) => `/users/admin/${id}`;

// Product APIs
export const PRODUCTS_API = '/products';
export const PRODUCT_BY_ID_API = (id) => `/products/${id}`;
export const PRODUCT_SEARCH_API = '/products/search';
export const PRODUCT_COUNT_API = '/products/get/count';
export const PRODUCT_FEATURED_API = (count = 0) => `/products/get/Featured/${count}`;

// Category APIs
export const CATEGORIES_API = '/category';
export const CATEGORY_BY_ID_API = (id) => `/category/${id}`;

// Cart APIs
export const USER_CART_API = (userId) => `/cart/${userId}`;
export const ADD_TO_CART_API = '/cart';
export const UPDATE_CART_ITEM_API = (userId) => `/cart/${userId}`;
export const REMOVE_FROM_CART_API = (userId) => `/cart/${userId}`;
export const CLEAR_CART_API = (userId) => `/cart/clear/${userId}`;

// Purchase & Order APIs
export const PURCHASE_FROM_CART_API = (userId) => `/purchase/cart/${userId}`;
export const DIRECT_PURCHASE_API = (userId) => `/purchase/direct/${userId}`;
export const USER_ORDERS_API = (userId) => `/purchase/user/${userId}`;
export const ORDER_DETAILS_API = (orderId) => `/purchase/${orderId}`;

// Admin Order Management
export const ADMIN_ORDERS_API = '/orders';
export const ADMIN_ORDER_BY_ID_API = (orderId) => `/orders/${orderId}`;
export const ADMIN_UPDATE_ORDER_STATUS_API = (orderId) => `/orders/${orderId}`;
export const ADMIN_DELETE_ORDER_API = (orderId) => `/orders/${orderId}`;
export const ADMIN_TOTAL_SALES_API = '/orders/get/totalsales';
export const ADMIN_ORDER_COUNT_API = '/orders/get/count';
export const ADMIN_USER_ORDERS_API = (userId) => `/orders/user/${userId}`;

// UPI Payment APIs
export const UPI_SUPPORTED_APPS_API = '/upi-payments/supported-apps';
export const UPI_PROCESS_PAYMENT_API = (orderId) => `/upi-payments/process/${orderId}`;
export const UPI_PAYMENT_STATUS_API = (orderId) => `/upi-payments/status/${orderId}`;
export const UPI_PAYMENT_HISTORY_API = (userId) => `/upi-payments/history/${userId}`;

// Razorpay Gateway APIs
export const UPI_GATEWAY_CREATE_API = (orderId) => `/upi-payments/gateway/create/${orderId}`;
export const UPI_GATEWAY_VERIFY_API = '/upi-payments/gateway/verify';