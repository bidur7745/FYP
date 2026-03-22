const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_PROD_API_URL || import.meta.env.VITE_API_URL || 'https://krishimitra-zzo6.onrender.com')
  : (import.meta.env.VITE_API_URL || 'http://localhost:5002');

export { API_BASE };
import { getCache, setCache, removeCache } from '../utils/cache';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const withAuth = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Cache configuration for different endpoints
const CACHE_CONFIG = {
  '/api/users/profile': { ttl: 10 * 60 * 1000 }, // 10 minutes
  '/api/crops': { ttl: 30 * 60 * 1000 }, // 30 minutes (crops don't change often)
  '/api/crops/recommended': { ttl: 15 * 60 * 1000 }, // 15 minutes (recommendations may change with season)
  '/api/crops/filter': { ttl: 20 * 60 * 1000 }, // 20 minutes
  '/api/crops/search': { ttl: 10 * 60 * 1000 }, // 10 minutes (search results)
  '/api/plantation-guide': { ttl: 30 * 60 * 1000 }, // 30 minutes (guides don't change often)
  '/api/planting-calendar': { ttl: 30 * 60 * 1000 }, // 30 minutes (calendars don't change often)
  '/api/weather/current': { ttl: 15 * 60 * 1000 }, // 15 minutes (weather data cached for better performance)
  '/api/weather/forecast': { ttl: 60 * 60 * 1000 }, // 60 minutes (forecast updates less frequently, cache longer)
  '/api/weather/extended': { ttl: 60 * 60 * 1000 }, // 60 minutes
  '/api/alerts': { ttl: 2 * 60 * 1000 }, // 2 minutes (alerts need to be fresh)
  '/api/alerts/unread-count': { ttl: 1 * 60 * 1000 }, // 1 minute (count needs to be very fresh)
  '/dashboard/expert': { ttl: 5 * 60 * 1000 },
  '/api/government-schemes': { ttl: 5 * 60 * 1000 }, // 5 minutes cache for schemes
  '/api/users/all': { ttl: 5 * 60 * 1000 }, // 5 minutes – admin user list (save resources)
  '/api/users/experts': { ttl: 5 * 60 * 1000 }, // 5 minutes – experts list (save resources)
  '/api/market-prices': { ttl: 10 * 60 * 1000 }, // 10 minutes – market prices
  '/api/market-prices/crops': { ttl: 30 * 60 * 1000 }, // 30 minutes – crop list
};

export const apiRequest = async (path, options = {}, requireAuth = false, useCache = false) => {
  const cacheKey = `${path}_${JSON.stringify(options)}`;
  
  // Check cache for GET and POST requests (POST with same body will use cache)
  if (useCache && (options.method === 'GET' || !options.method || options.method === 'POST')) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${path}`);
      return cached;
    }
  }

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : defaultHeaders),
    ...(requireAuth ? withAuth() : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const message = data?.message || 'Request failed';
      throw new Error(message);
    }

    // Cache successful GET and POST responses (for POST with same body, use cache)
    if (useCache && (options.method === 'GET' || !options.method || options.method === 'POST')) {
      // Find matching cache config (check base path for query params)
      const basePath = path.split('?')[0];
      const config = CACHE_CONFIG[basePath] || CACHE_CONFIG[path] || {};
      const ttl = config.ttl || 5 * 60 * 1000; // Default 5 minutes
      setCache(cacheKey, data, ttl);
      console.log(`[Cache Set] ${path} (TTL: ${ttl / 1000}s)`);
    }

    return data;
  } catch (error) {
    // If API fails but we have cached data, return it
    if (useCache && (options.method === 'GET' || !options.method || options.method === 'POST')) {
      const cached = getCache(cacheKey);
      if (cached) {
        console.log(`[Cache Fallback] ${path} - Using stale cache`);
        return cached;
      }
    }
    throw error;
  }
};

// Dashboard - Get dashboard data (with caching)
export const getDashboard = (role, forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/dashboard/${role}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(`/dashboard/${role}`, { method: 'GET' }, true, true);
};

// Auth - Register user
export const registerUser = (payload) =>
  apiRequest('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Auth - Verify registration OTP
export const verifyRegistrationOtp = (payload) =>
  apiRequest('/api/users/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Auth - Login user
export const loginUser = (payload) =>
  apiRequest('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Auth - Request password reset OTP
export const requestPasswordReset = (payload) =>
  apiRequest('/api/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Auth - Verify password reset OTP
export const verifyPasswordResetOtp = (payload) =>
  apiRequest('/api/users/verify-password-reset-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Auth - Reset password
export const resetPassword = (payload) =>
  apiRequest('/api/users/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Crop Advisory - Get all crops (with caching)
export const getAllCrops = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/crops_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/crops', { method: 'GET' }, true, true);
};

// Crop Advisory - Get plantation guide for a crop (with caching)
export const getPlantationGuide = (cropId, forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/plantation-guide/${cropId}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(`/api/plantation-guide/${cropId}`, { method: 'GET' }, true, true);
};

// Crop Advisory - Get all planting calendars for a crop (with caching)
export const getAllPlantingCalendars = (cropId, forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/planting-calendar/${cropId}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(`/api/planting-calendar/${cropId}`, { method: 'GET' }, true, true);
};

// User Profile - Get user profile (with caching)
export const getUserProfile = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/users/profile_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/users/profile', { method: 'GET' }, true, true);
};

// Subscription - Public pricing (Khalti NPR / Stripe USD) for Premium page
export const getSubscriptionPricing = () =>
  apiRequest('/api/subscription/pricing', { method: 'GET' }, false, false);

// Subscription - Get current user's subscription
export const getSubscription = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/subscription_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/subscription', { method: 'GET' }, true, forceRefresh ? false : true);
};

// Subscription - Initiate Khalti payment (returns payment_url)
export const createSubscription = () =>
  apiRequest('/api/subscription', { method: 'POST' }, true, false);

// Subscription - Verify payment after Khalti redirect (pidx from URL, amount in paisa)
export const verifySubscription = (payload) =>
  apiRequest('/api/subscription/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);

// Subscription - Stripe Checkout (monthly recurring, test mode) — returns checkout_url
export const createStripeSubscriptionCheckout = () =>
  apiRequest('/api/subscription/stripe/checkout', { method: 'POST' }, true, false);

// Subscription - After Stripe redirect (session_id in URL); idempotent if webhook already activated
export const verifyStripeSubscriptionSession = (payload) =>
  apiRequest('/api/subscription/stripe/verify-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true, false);

// Subscription - Cancel (at period end)
export const cancelSubscription = () =>
  apiRequest('/api/subscription/cancel', { method: 'POST' }, true, false);

// Subscription - Admin: list all subscriptions (admin only)
export const getAdminSubscriptions = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', params.limit)
  const path = qs.toString() ? `/api/subscription/admin?${qs}` : '/api/subscription/admin'
  return apiRequest(path, { method: 'GET' }, true, false)
}

// Subscription - Admin: stats (premium user count, revenue, premiumUserIds)
export const getAdminSubscriptionStats = () =>
  apiRequest('/api/subscription/admin/stats', { method: 'GET' }, true, false)

// Chat - List conversations for current user
export const getChatConversations = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  const path = qs.toString() ? `/api/chat/conversations?${qs}` : '/api/chat/conversations';
  return apiRequest(path, { method: 'GET' }, true, false);
};

// Chat - Create conversation (type, participantUserIds?, subject?, diseasePredictionId?, expertId?)
export const createChatConversation = (payload) =>
  apiRequest('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true, false);

// Chat - Get single conversation
export const getChatConversation = (id) =>
  apiRequest(`/api/chat/conversations/${id}`, { method: 'GET' }, true, false);

// Chat - Update conversation metadata (subject, avatarUrl)
export const updateChatConversation = (id, payload) =>
  apiRequest(`/api/chat/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, true, false);

// Chat - Remove member from conversation (admin/group owner only)
export const removeChatMember = (conversationId, userId) =>
  apiRequest(`/api/chat/conversations/${conversationId}/members/${userId}`, {
    method: 'DELETE',
  }, true, false);

// Chat - Get messages (before?, limit?)
export const getChatMessages = (conversationId, params = {}) => {
  const qs = new URLSearchParams();
  if (params.before) qs.set('before', params.before);
  if (params.limit) qs.set('limit', params.limit);
  const path = `/api/chat/conversations/${conversationId}/messages${qs.toString() ? `?${qs}` : ''}`;
  return apiRequest(path, { method: 'GET' }, true, false);
};

// Chat - Send message
export const sendChatMessage = (conversationId, payload) =>
  apiRequest(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true, false);

// Chat - Total unread message count
export const getChatUnreadCount = () =>
  apiRequest('/api/chat/unread-count', { method: 'GET' }, true, false);

// Chat - Mark read up to messageId
export const markChatRead = (conversationId, messageId) =>
  apiRequest(`/api/chat/conversations/${conversationId}/read`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  }, true, false);

export const deleteChatMessage = (conversationId, messageId) =>
  apiRequest(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
    method: 'DELETE',
  }, true, false);

// Chat - Available people for group/DM (search?, role?)
export const getChatAvailablePeople = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.role) qs.set('role', params.role);
  const path = qs.toString() ? `/api/chat/available-people?${qs}` : '/api/chat/available-people';
  return apiRequest(path, { method: 'GET' }, true, false);
};

// Chat - Verify with expert context (previousExpert + availableExperts)
export const getVerifyWithExpertContext = () =>
  apiRequest('/api/chat/verify-with-expert/context', { method: 'GET' }, true, false);

// User Profile - Update user profile (invalidate cache on update)
export const updateUserProfile = async (payload) => {
  const result = await apiRequest('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);
  
  // Invalidate profile cache after update
  const cacheKey = `/api/users/profile_${JSON.stringify({ method: 'GET' })}`;
  removeCache(cacheKey);
  
  return result;
};

// Upload image (e.g. profile, license) - multipart, returns { url, publicId }
export const uploadImage = async (file, folder = 'krishimitra') => {
  const formData = new FormData();
  formData.append('image', file);
  if (folder) formData.append('folder', folder);
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE}/api/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data;
};

export const uploadFile = async (file, folder = 'krishimitra') => {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE}/api/upload/file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data;
};

// Admin: List experts (for verification) – cached 5 min
export const getExperts = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/users/experts_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/users/experts', { method: 'GET' }, true, true);
};

// Admin: List all users (farmers and experts) – cached 5 min
export const getAllUsers = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/users/all_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/users/all', { method: 'GET' }, true, true);
};

// Admin: Verify expert (set isVerifiedExpert = true)
export const verifyExpert = (userId) =>
  apiRequest(`/api/users/${userId}/verify-expert`, { method: 'PATCH', body: JSON.stringify({ verified: true }) }, true);

// Admin: Reject expert verification (set isVerifiedExpert = false)
export const rejectExpert = (userId) =>
  apiRequest(`/api/users/${userId}/verify-expert`, { method: 'PATCH', body: JSON.stringify({ verified: false }) }, true);

// User/Expert: Delete own account
export const deleteMyProfile = () =>
  apiRequest('/api/users/me', { method: 'DELETE' }, true);

// Crop Advisory - Get recommended crops for logged-in user
export const getRecommendedCrops = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/crops/recommended_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest('/api/crops/recommended', { method: 'GET' }, true, true);
};

// Crop Advisory - Filter crops
export const getFilteredCrops = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.region) queryParams.append('region', filters.region);
  if (filters.season) queryParams.append('season', filters.season);
  if (filters.category) queryParams.append('category', filters.category);
  
  const queryString = queryParams.toString();
  const path = `/api/crops/filter${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Crop Advisory - Search crops
export const searchCrops = (query, forceRefresh = false) => {
  const path = `/api/crops/search?q=${encodeURIComponent(query)}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Weather Services - Get current weather by coordinates (server expects POST with body)
export const getCurrentWeather = async (latitude, longitude, forceRefresh = false) => {
  const path = '/api/weather/current';
  const options = {
    method: 'POST',
    body: JSON.stringify({ latitude: Number(latitude), longitude: Number(longitude) }),
  };

  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify(options)}`;
    removeCache(cacheKey);
  }

  return apiRequest(path, options, true, true);
};

// Weather Services - Get weather forecast by coordinates
export const getWeatherForecast = async (latitude, longitude, forceRefresh = false) => {
  const path = `/api/weather/forecast?lat=${latitude}&lon=${longitude}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Weather Services - Get extended weather forecast by coordinates
export const getExtendedWeather = async (latitude, longitude, forceRefresh = false) => {
  const path = `/api/weather/extended?lat=${latitude}&lon=${longitude}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Alerts - Get user alerts (with caching)
export const getUserAlerts = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.read !== undefined) queryParams.append('read', filters.read);
  if (filters.type) queryParams.append('type', filters.type);
  
  const queryString = queryParams.toString();
  const path = `/api/alerts${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Alerts - Mark alert as read
export const markAlertAsRead = (alertId) =>
  apiRequest(`/api/alerts/${alertId}/read`, { method: 'PUT' }, true);

// Alerts - Get unread alert count (with caching)
export const getUnreadAlertCount = (forceRefresh = false) => {
  const path = '/api/alerts/unread-count';
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Government Schemes - Get all schemes (with caching)
export const getAllGovernmentSchemes = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.region) queryParams.append('region', filters.region);
  
  const queryString = queryParams.toString();
  const path = `/api/government-schemes${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Government Schemes - Get scheme by ID (with caching)
export const getGovernmentSchemeById = (schemeId, forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/government-schemes/${schemeId}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(`/api/government-schemes/${schemeId}`, { method: 'GET' }, true, true);
};

// Government Schemes - Search schemes
export const searchGovernmentSchemes = (query, forceRefresh = false) => {
  const path = `/api/government-schemes/search?q=${encodeURIComponent(query)}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Government Schemes - Filter schemes
export const getFilteredGovernmentSchemes = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.region) queryParams.append('region', filters.region);
  if (filters.eligibility) queryParams.append('eligibility', filters.eligibility);
  
  const queryString = queryParams.toString();
  const path = `/api/government-schemes/filter${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Admin: Crop Management - Create crop with details
export const createCropWithDetails = (payload) =>
  apiRequest('/api/crops/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);

// Admin: Crop Management - Update crop
export const updateCrop = (cropId, payload) =>
  apiRequest(`/api/crops/${cropId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);

// Admin: Crop Management - Delete crop
export const deleteCrop = (cropId) =>
  apiRequest(`/api/crops/${cropId}`, {
    method: 'DELETE',
  }, true);

// Admin: Government Subsidy - Create scheme
export const createGovernmentScheme = (payload) =>
  apiRequest('/api/government-schemes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);

// Admin: Government Subsidy - Update scheme
export const updateGovernmentScheme = (schemeId, payload) =>
  apiRequest(`/api/government-schemes/${schemeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);

// Admin: Government Subsidy - Delete scheme
export const deleteGovernmentScheme = (schemeId) =>
  apiRequest(`/api/government-schemes/${schemeId}`, {
    method: 'DELETE',
  }, true);

// Admin: Government Subsidy - Update scheme details
export const updateGovernmentSchemeDetails = (schemeId, detailsPayload) =>
  apiRequest(`/api/government-schemes/${schemeId}/details`, {
    method: 'PUT',
    body: JSON.stringify(detailsPayload),
  }, true);

// Support / Contact form - submit (optional auth: send token if logged in)
export const submitSupportQuery = (payload) => {
  const headers = { ...defaultHeaders, ...withAuth() };
  return fetch(`${API_BASE}/api/support`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) throw new Error(data.message || 'Failed to send message');
      return data;
    });
};

// Support - get my queries (logged-in user)
export const getMySupportQueries = () =>
  apiRequest('/api/support/my-queries', { method: 'GET' }, true);

// Admin: Support - list all queries
export const getSupportQueriesList = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/api/support${q ? `?${q}` : ''}`, { method: 'GET' }, true);
};

// Admin: Support - reply to query
export const replySupportQuery = (queryId, adminReply) =>
  apiRequest(`/api/support/${queryId}`, {
    method: 'PUT',
    body: JSON.stringify({ adminReply }),
  }, true);

// Notifications - list
export const getNotifications = (limit = 50) =>
  apiRequest(`/api/notifications?limit=${limit}`, { method: 'GET' }, true);

// Notifications - unread count
export const getUnreadNotificationCount = () =>
  apiRequest('/api/notifications/unread-count', { method: 'GET' }, true, true);

// Notifications - mark one as read
export const markNotificationRead = (notificationId) =>
  apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' }, true);

// Notifications - mark all as read
export const markAllNotificationsRead = () =>
  apiRequest('/api/notifications/read-all', { method: 'PUT' }, true);

// Market Prices (farmer) – latest prices with optional filters
export const getMarketPrices = (params = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (params.crop) queryParams.append('crop', params.crop);
  if (params.market) queryParams.append('market', params.market);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  const path = `/api/market-prices${queryParams.toString() ? `?${queryParams}` : ''}`;
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Market Prices – manually trigger scrape (Refresh button)
export const refreshMarketPrices = () =>
  apiRequest('/api/market-prices/scrape', { method: 'POST' }, true);

// Market Prices – list crop names for dropdown
export const getMarketPriceCrops = (forceRefresh = false) => {
  const path = '/api/market-prices/crops';
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Market Prices – prices for one crop
export const getMarketPricesByCrop = (cropName, days = 30, forceRefresh = false) => {
  const path = `/api/market-prices/crops/${encodeURIComponent(cropName)}?days=${days}`;
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Market Prices – trends for one crop (charts)
export const getMarketPriceTrends = (cropName, days = 30, forceRefresh = false) => {
  const path = `/api/market-prices/crops/${encodeURIComponent(cropName)}/trends?days=${days}`;
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Market Prices – statistics
export const getMarketPriceStatistics = (params = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (params.commodity) queryParams.append('commodity', params.commodity);
  if (params.days) queryParams.append('days', params.days);
  const path = `/api/market-prices/statistics${queryParams.toString() ? `?${queryParams}` : ''}`;
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Disease Detection – run prediction (proxy to FastAPI via backend)
export const predictDisease = (file, crop) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('crop', crop);
  return apiRequest('/api/disease/predict', {
    method: 'POST',
    body: formData,
  }, true, false);
};

// Disease catalog – list or get by crop+class (public, optional lang=en|ne)
export const getDiseaseCatalog = (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const path = searchParams ? `/api/disease/catalog?${searchParams}` : '/api/disease/catalog';
  return apiRequest(path, { method: 'GET' }, false, true);
};

export const getDiseaseByCropAndClass = (crop, className, lang) => {
  const params = new URLSearchParams({ crop, className });
  if (lang) params.set('lang', lang);
  return apiRequest(`/api/disease/catalog/by?${params}`, { method: 'GET' }, false, true);
};

// Disease treatments – fetch (farmer only; auth required)
export const getDiseaseTreatments = (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const path = searchParams ? `/api/disease/treatments?${searchParams}` : '/api/disease/treatments';
  return apiRequest(path, { method: 'GET' }, true, false);
};

// Admin – disease catalog CRUD (auth required)
export const adminGetDiseases = (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const path = searchParams ? `/api/disease/catalog?${searchParams}` : '/api/disease/catalog';
  return apiRequest(path, { method: 'GET' }, true, false);
};
export const adminCreateDisease = (payload) =>
  apiRequest('/api/disease/catalog', { method: 'POST', body: JSON.stringify(payload) }, true);
export const adminUpdateDisease = (id, payload) =>
  apiRequest(`/api/disease/catalog/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true);
export const adminDeleteDisease = (id) =>
  apiRequest(`/api/disease/catalog/${id}`, { method: 'DELETE' }, true);

// Admin – treatments CRUD (auth required)
export const adminGetTreatments = (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const path = searchParams ? `/api/disease/treatments/list?${searchParams}` : '/api/disease/treatments/list';
  return apiRequest(path, { method: 'GET' }, true, false);
};
export const adminCreateTreatment = (payload) =>
  apiRequest('/api/disease/treatments', { method: 'POST', body: JSON.stringify(payload) }, true);
export const adminUpdateTreatment = (id, payload) =>
  apiRequest(`/api/disease/treatments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true);
export const adminDeleteTreatment = (id) =>
  apiRequest(`/api/disease/treatments/${id}`, { method: 'DELETE' }, true);

// Agro Recommendations (AI-powered fertilizer/pesticide/herbicide advice per crop)
export const getAgroRecommendations = (cropId, lang = 'en') =>
  apiRequest(`/api/agro-recommendations/${cropId}?lang=${lang}`, { method: 'GET' }, true, false);
