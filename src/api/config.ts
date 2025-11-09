export const baseUrlAPI =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const baseUrl = (() => {
  const url = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";
  return url.startsWith('http') ? url : `http://${url}`;
})();
