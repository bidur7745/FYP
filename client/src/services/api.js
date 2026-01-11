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
  '/dashboard/user': { ttl: 5 * 60 * 1000 }, // 5 minutes
  '/dashboard/admin': { ttl: 5 * 60 * 1000 },
  '/dashboard/expert': { ttl: 5 * 60 * 1000 },
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

export const getDashboard = (role, forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/dashboard/${role}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  return apiRequest(`/dashboard/${role}`, { method: 'GET' }, true, true);
};

export const loginUser = (payload) =>
  apiRequest('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const registerUser = (payload) =>
  apiRequest('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyRegistrationOtp = (payload) =>
  apiRequest('/api/users/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = (payload) =>
  apiRequest('/api/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyPasswordResetOtp = (payload) =>
  apiRequest('/api/users/verify-password-reset-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resetPassword = (payload) =>
  apiRequest('/api/users/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Crop Advisory - Admin: create crop with full details (crop + guide + calendar) (invalidate cache)
export const createCropWithDetails = async (payload) => {
  const result = await apiRequest('/api/crops/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
  
  // Invalidate all crop-related caches after creating new crop
  const cacheKeys = [
    `/api/crops_${JSON.stringify({ method: 'GET' })}`,
    `/api/crops/recommended_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  // Note: Filter and search caches will expire naturally, or can be cleared on next use
  
  return result;
};

// Crop Advisory - Get all crops (with caching)
export const getAllCrops = (forceRefresh = false) => {
  if (forceRefresh) {
    const cacheKey = `/api/crops_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  // Note: This endpoint might be public, but we'll cache it anyway
  return apiRequest('/api/crops', { method: 'GET' }, false, true);
};

// Crop Advisory - Update crop (invalidate cache on update)
export const updateCrop = async (cropId, payload) => {
  const result = await apiRequest(`/api/crops/${cropId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);
  
  // Invalidate all crop-related caches after update
  const cacheKeys = [
    `/api/crops_${JSON.stringify({ method: 'GET' })}`,
    `/api/crops/recommended_${JSON.stringify({ method: 'GET' })}`,
    `/api/plantation-guide/${cropId}_${JSON.stringify({ method: 'GET' })}`,
    `/api/planting-calendar/${cropId}_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
};

// Crop Advisory - Delete crop (invalidate cache on delete)
export const deleteCrop = async (cropId) => {
  const result = await apiRequest(`/api/crops/${cropId}`, {
    method: 'DELETE',
  }, true);
  
  // Invalidate all crop-related caches after delete
  const cacheKeys = [
    `/api/crops_${JSON.stringify({ method: 'GET' })}`,
    `/api/crops/recommended_${JSON.stringify({ method: 'GET' })}`,
    `/api/plantation-guide/${cropId}_${JSON.stringify({ method: 'GET' })}`,
    `/api/planting-calendar/${cropId}_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
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

// Weather Services - Get current weather by coordinates
export const getCurrentWeather = async (latitude, longitude, forceRefresh = false) => {
  const path = '/api/weather/current';
  // Create a normalized cache key based on coordinates (rounded to 4 decimal places for matching nearby locations)
  const latRounded = latitude.toFixed(4);
  const lonRounded = longitude.toFixed(4);
  const cacheKey = `${path}_lat_${latRounded}_lon_${lonRounded}_POST`;
  
  if (forceRefresh) {
    removeCache(cacheKey);
  }
  
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Weather Cache Hit] ${path} for coordinates (${latRounded}, ${lonRounded})`);
      return cached;
    }
  }
  
  const result = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  }, true, false); // Don't use apiRequest cache, we handle it manually
  
  // Cache the result manually with our custom key
  if (result.success) {
    const config = CACHE_CONFIG[path] || {};
    const ttl = config.ttl || 15 * 60 * 1000; // 15 minutes default
    setCache(cacheKey, result, ttl);
    console.log(`[Weather Cache Set] ${path} for coordinates (${latRounded}, ${lonRounded}) - TTL: ${ttl / 1000}s`);
  }
  
  return result;
};

// Weather Services - Get forecast by coordinates
export const getWeatherForecast = async (latitude, longitude, forceRefresh = false) => {
  // Round coordinates for cache key matching
  const latRounded = latitude.toFixed(4);
  const lonRounded = longitude.toFixed(4);
  const cacheKey = `/api/weather/forecast_lat_${latRounded}_lon_${lonRounded}_GET`;
  
  if (forceRefresh) {
    removeCache(cacheKey);
  }
  
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Forecast Cache Hit] for coordinates (${latRounded}, ${lonRounded})`);
      return cached;
    }
  }
  
  // Make API request with original coordinates (not rounded)
  const path = `/api/weather/forecast?lat=${latitude}&lon=${longitude}`;
  const result = await apiRequest(path, { 
    method: 'GET' 
  }, true, false); // Don't use apiRequest cache, we handle it manually
  
  // Cache the result manually with our custom key
  if (result && result.success) {
    const config = CACHE_CONFIG['/api/weather/forecast'] || {};
    const ttl = config.ttl || 60 * 60 * 1000; // 60 minutes default
    setCache(cacheKey, result, ttl);
    console.log(`[Forecast Cache Set] for coordinates (${latRounded}, ${lonRounded}) - TTL: ${ttl / 1000}s`);
  }
  
  return result;
};

// Weather Services - Get extended weather (hourly + daily)
export const getExtendedWeather = async (latitude, longitude, forceRefresh = false) => {
  // Round coordinates for cache key matching
  const latRounded = latitude.toFixed(4);
  const lonRounded = longitude.toFixed(4);
  const cacheKey = `/api/weather/extended_lat_${latRounded}_lon_${lonRounded}_GET`;
  
  if (forceRefresh) {
    removeCache(cacheKey);
  }
  
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Extended Weather Cache Hit] for coordinates (${latRounded}, ${lonRounded})`);
      return cached;
    }
  }
  
  // Make API request with original coordinates (not rounded)
  const path = `/api/weather/extended?lat=${latitude}&lon=${longitude}`;
  const result = await apiRequest(path, { 
    method: 'GET' 
  }, true, false); // Don't use apiRequest cache, we handle it manually
  
  // Cache the result manually with our custom key
  if (result && result.success) {
    const config = CACHE_CONFIG['/api/weather/extended'] || {};
    const ttl = config.ttl || 60 * 60 * 1000; // 60 minutes default
    setCache(cacheKey, result, ttl);
    console.log(`[Extended Weather Cache Set] for coordinates (${latRounded}, ${lonRounded}) - TTL: ${ttl / 1000}s`);
  }
  
  return result;
};

// Alerts - Get user alerts
export const getUserAlerts = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.severity) queryParams.append('severity', filters.severity);
  if (filters.type) queryParams.append('type', filters.type);
  
  const queryString = queryParams.toString();
  const path = `/api/alerts${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Alerts - Get unread alert count
export const getUnreadAlertCount = (forceRefresh = false) => {
  const path = '/api/alerts/unread-count';
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, true, true);
};

// Alerts - Mark alert as read
export const markAlertAsRead = async (alertId) => {
  const result = await apiRequest(`/api/alerts/${alertId}/read`, {
    method: 'PUT',
  }, true, false);
  
  // Invalidate alerts cache after marking as read
  const alertsCacheKey = `/api/alerts_${JSON.stringify({ method: 'GET' })}`;
  removeCache(alertsCacheKey);
  const unreadCacheKey = `/api/alerts/unread-count_${JSON.stringify({ method: 'GET' })}`;
  removeCache(unreadCacheKey);
  
  return result;
};

// Government Schemes - Get all schemes
export const getAllGovernmentSchemes = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.level) queryParams.append('level', filters.level);
  if (filters.province) queryParams.append('province', filters.province);
  if (filters.district) queryParams.append('district', filters.district);
  if (filters.schemeType) queryParams.append('schemeType', filters.schemeType);
  
  const queryString = queryParams.toString();
  const path = `/api/government-schemes${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, false, true);
};

// Government Schemes - Get scheme by ID
export const getGovernmentSchemeById = (schemeId, forceRefresh = false) => {
  const path = `/api/government-schemes/${schemeId}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, false, true);
};

// Government Schemes - Search schemes
export const searchGovernmentSchemes = (query, forceRefresh = false) => {
  const path = `/api/government-schemes/search?q=${encodeURIComponent(query)}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, false, true);
};

// Government Schemes - Filter schemes
export const getFilteredGovernmentSchemes = (filters = {}, forceRefresh = false) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.level) queryParams.append('level', filters.level);
  if (filters.province) queryParams.append('province', filters.province);
  if (filters.district) queryParams.append('district', filters.district);
  if (filters.schemeType) queryParams.append('schemeType', filters.schemeType);
  if (filters.regionScope) queryParams.append('regionScope', filters.regionScope);
  if (filters.localBodyType) queryParams.append('localBodyType', filters.localBodyType);
  
  const queryString = queryParams.toString();
  const path = `/api/government-schemes/filter${queryString ? `?${queryString}` : ''}`;
  
  if (forceRefresh) {
    const cacheKey = `${path}_${JSON.stringify({ method: 'GET' })}`;
    removeCache(cacheKey);
  }
  
  return apiRequest(path, { method: 'GET' }, false, true);
};

// Government Schemes - Create scheme (Admin only)
export const createGovernmentScheme = async (payload) => {
  const result = await apiRequest('/api/government-schemes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true, false);
  
  // Invalidate schemes cache after creating
  const cacheKeys = [
    `/api/government-schemes_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/filter_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
};

// Government Schemes - Update scheme (Admin only)
export const updateGovernmentScheme = async (schemeId, payload) => {
  const result = await apiRequest(`/api/government-schemes/${schemeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true, false);
  
  // Invalidate schemes cache after update
  const cacheKeys = [
    `/api/government-schemes_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/${schemeId}_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/filter_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
};

// Government Schemes - Update scheme details (Admin only)
export const updateGovernmentSchemeDetails = async (schemeId, payload) => {
  const result = await apiRequest(`/api/government-schemes/${schemeId}/details`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true, false);
  
  // Invalidate schemes cache after update
  const cacheKeys = [
    `/api/government-schemes/${schemeId}_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/${schemeId}/details_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
};

// Government Schemes - Delete scheme (Admin only)
export const deleteGovernmentScheme = async (schemeId) => {
  const result = await apiRequest(`/api/government-schemes/${schemeId}`, {
    method: 'DELETE',
  }, true, false);
  
  // Invalidate schemes cache after delete
  const cacheKeys = [
    `/api/government-schemes_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/${schemeId}_${JSON.stringify({ method: 'GET' })}`,
    `/api/government-schemes/filter_${JSON.stringify({ method: 'GET' })}`,
  ];
  cacheKeys.forEach(key => removeCache(key));
  
  return result;
};