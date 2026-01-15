import { baseUrlAPI } from "./config";

export interface Decoration {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  type: "avatar" | "background" | "card";
  isEquipped?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path: string;
  method?: string;
}

// Get all available decorations
export const getAllDecorations = async (): Promise<ApiResponse<Decoration[]>> => {
  const response = await fetch(`${baseUrlAPI}/shop/decorations`);
  return response.json();
};

// Get decorations by type
export const getDecorationsByType = async (
  type: "avatar" | "background" | "card",
): Promise<ApiResponse<Decoration[]>> => {
  const response = await fetch(`${baseUrlAPI}/shop/decorations/${type}`);
  return response.json();
};

// Get user's owned decorations (requires auth)
export const getUserDecorations = async (): Promise<ApiResponse<Decoration[]>> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${baseUrlAPI}/shop/profile/decorations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

// Purchase decoration (requires auth)
export const purchaseDecoration = async (
  type: "avatar" | "background" | "card",
  decorationId: string,
): Promise<ApiResponse<{ message: string; balance?: number }>> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${baseUrlAPI}/shop/purchase/${type}/${decorationId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

// Equip decoration (requires auth)
export const equipDecoration = async (
  type: "avatar" | "background" | "card",
  decorationId: string,
): Promise<ApiResponse<{ message: string; decorationId: string }>> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${baseUrlAPI}/shop/equip/${type}/${decorationId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

// Unequip decoration (requires auth)
export const unequipDecoration = async (
  type: "avatar" | "background" | "card",
): Promise<ApiResponse<{ message: string }>> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${baseUrlAPI}/shop/equip/${type}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};
