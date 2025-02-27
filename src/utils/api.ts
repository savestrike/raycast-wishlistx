import fetch, { FormData } from "node-fetch";
import { getToken, signIn } from "./auth";
import { API_BASE_URL } from "./constants";
import { showToast, Toast } from "@raycast/api";

// Define the API response type
export type WishlistResponse = {
  success: boolean;
  wishlists: Wishlist[];
};

export type Wishlist = {
  id: number;
  name: string;
  count: number;
};

export type WishlistDetailResponse = {
  success: boolean;
  wishlist: {
    favorites: SavedItem[];
  };
}

export type SavedItemsResponse = {
  success: boolean;
  favorites: SavedItem[];
}

export type SavedItem = {
    id: number;
    name: string;
    target_amount: string;
    image: {
        url: string;
    };
    url: string;
    tracking_url: string;
    wishlist_id?: number;
};

async function handleAuthError(): Promise<boolean> {
  const success = await signIn();
  if (!success) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Authentication failed",
      message: "Please check your credentials in preferences"
    });
  }
  return success;
}

interface AddItemData {
  name: string;
  description?: string;
  imageUrl?: string;
  targetAmount?: string;
  url: string;
}

export async function addItem(data: AddItemData): Promise<boolean> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return false;

  try {
    const formData = new FormData();
    formData.append("favorite[name]", data.name);
    formData.append("favorite[url]", data.url);
    formData.append("favorite[favorite_type]", "imported_from_extension");

    if (data.description) {
      formData.append("favorite[description]", data.description);
    }
    if (data.targetAmount) {
      formData.append("favorite[target_amount]", data.targetAmount);
    }
    if (data.imageUrl) {
      // Fetch image and convert to blob
      const imageResponse = await fetch(data.imageUrl);
      const blob = await imageResponse.blob();
      formData.append("favorite[image]", blob, "product_image.jpg");
    }

    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? addItem(data) : false;
    }

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add item",
        message: "Please try again"
      });
      return false;
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Item added successfully"
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to add item",
      message: String(error)
    });
    return false;
  }
}

// Add new function to get wishlists
export async function getWishlists(): Promise<Wishlist[]> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/wishlists`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-api-version": "1.1",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? getWishlists() : [];
    }

    const data = await response.json() as WishlistResponse;
    return data.wishlists;
  } catch {
    return [];
  }
}

// Get saved items
export async function getSavedItems(wishlistId?: number): Promise<{ data: SavedItem[]}> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return { data: [] };

  const url = wishlistId
    ? `${API_BASE_URL}/wishlists/${wishlistId}`
    : `${API_BASE_URL}/favorites`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(wishlistId && { "x-api-version": "1.1" }),
      },
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? getSavedItems(wishlistId) : { data: [] };
    }

    if (wishlistId) {
      const data = await response.json() as WishlistDetailResponse;
      return { data: data.wishlist.favorites };
    } else {
      const data = await response.json() as SavedItemsResponse;
      return { data: data.favorites };
    }
  } catch {
    return { data: [] };
  }
}

export async function updateFavoriteWishlist(
  favoriteId: number,
  wishlistId: number | null,
  currentWishlistId?: number,
  wishlists: Wishlist[] = []
): Promise<boolean> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return false;

  try {
    const formData = new FormData();
    if (wishlistId) {
      formData.append("favorite[wishlist_id]", wishlistId.toString());
    } else {
      formData.append("favorite[wishlist_id]", "");
    }

    const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? updateFavoriteWishlist(favoriteId, wishlistId, currentWishlistId, wishlists) : false;
    }

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update item",
        message: "Please try again"
      });
      return false;
    }

    await showToast({
      style: Toast.Style.Success,
      title: wishlistId
        ? `Added to ${wishlists.find(w => w.id === wishlistId)?.name}`
        : currentWishlistId
          ? "Removed from wishlist"
          : `Moved to ${wishlists.find(w => w.id === wishlistId)?.name}`,
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to update item",
      message: String(error)
    });
    return false;
  }
}

export async function deleteFavorite(favoriteId: number): Promise<boolean> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? deleteFavorite(favoriteId) : false;
    }

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete item",
        message: "Please try again"
      });
      return false;
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Item deleted"
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to delete item",
      message: String(error)
    });
    return false;
  }
}
