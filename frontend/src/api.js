// Render дээрх backend URL-ийг шууд зааж өгөв
export const API_URL = import.meta.env.VITE_API_URL || "https://novaplay-674k.onrender.com";

/**
 * Нэвтрэх токен авах туслах функц
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Стандарт API хүсэлт илгээх туслах функц (fetch wrapper)
 * @param {string} endpoint - Жишээ нь: "/api/movies" эсвэл "/api/auth/login"
 * @param {object} options - Fetch options (method, body, headers г.м)
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  // Үндсэн Header тохиргоо
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Серверээс 401 (Unauthorized) ирвэл Токеныг цэвэрлэх
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Сүлжээний эсвэл серверийн алдаа гарлаа.");
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};