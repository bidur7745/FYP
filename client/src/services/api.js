const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';
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

  const headers = {
    ...defaultHeaders,
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
  apiRequest('/api/crops', {
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
