const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const getShortUrl = (shortCode) => (
  new URL(`${API_BASE_URL}/${encodeURIComponent(shortCode)}`, window.location.origin).toString()
);

export { API_BASE_URL, getShortUrl };