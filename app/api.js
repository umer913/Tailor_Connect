// Central API base URL — change this one value to point to your backend
export const API_BASE_URL = "http://UF-MacBook-Pro.local:3001";

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};
