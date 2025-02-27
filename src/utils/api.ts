import fetch, { FormData } from "node-fetch";
import { getToken, setToken } from "./auth";
import { API_BASE_URL } from "./constants";
import { showToast, Toast, Clipboard, popToRoot } from "@raycast/api";

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
  await showToast({
    style: Toast.Style.Failure,
    title: "Not signed in",
    message: "Use the Sign In or Sign Up command"
  });
  return false;
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

export async function deleteWishlist(wishlistId: number, deleteItems: boolean): Promise<boolean> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/wishlists/${wishlistId}?delete_favorites=${deleteItems}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? deleteWishlist(wishlistId, deleteItems) : false;
    }

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete wishlist",
        message: "Please try again"
      });
      return false;
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Wishlist deleted"
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to delete wishlist",
      message: String(error)
    });
    return false;
  }
}

export async function createWishlist(name: string): Promise<boolean> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) return false;

  try {
    const formData = new FormData();
    formData.append("wishlist[name]", name);

    const response = await fetch(`${API_BASE_URL}/wishlists`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      return (await handleAuthError()) ? createWishlist(name) : false;
    }

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create wishlist",
        message: "Please try again"
      });
      return false;
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Wishlist created"
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to create wishlist",
      message: String(error)
    });
    return false;
  }
}

type ShareResponse = {
  success: boolean;
  share: {
    share_url: string;
  };
}

export async function shareWishlist(wishlistId: number, wishlistName: string): Promise<string> {
  const token = await getToken();
  if (!token && !(await handleAuthError())) throw new Error("Authentication failed");

  try {
    await showToast({
      style: Toast.Style.Animated,
      title: `Creating share link for "${wishlistName}"...`
    });

    const formData = new FormData();
    formData.append("wishlist_id", wishlistId.toString());

    const response = await fetch(`${API_BASE_URL}/shares`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-api-version": "1.1",
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      if (await handleAuthError()) {
        return shareWishlist(wishlistId, wishlistName);
      }
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      throw new Error("Failed to create share link");
    }

    const data = await response.json() as ShareResponse;
    await Clipboard.copy(data.share.share_url);

    await showToast({
      style: Toast.Style.Success,
      title: "Share link copied to clipboard"
    });

    return data.share.share_url;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to create share link",
      message: String(error)
    });
    throw error;
  }
}

interface SignupData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirmation: string;
  phone: string;
}

export async function signup(data: SignupData): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("first_name", data.first_name);
    formData.append("last_name", data.last_name);
    formData.append("password", data.password);
    formData.append("password_confirmation", data.password_confirmation);
    formData.append("phone", data.phone);

    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: "POST",
      headers: {
        "x-api-version": "1.1",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to sign up");
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Verification code sent",
      message: "Please check your phone"
    });

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to sign up",
      message: String(error)
    });
    return false;
  }
}

export async function confirmSignup(phone: string, code: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("confirmation_token", code);

    const response = await fetch(`${API_BASE_URL}/auth/confirmation?confirmation_token=${code}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Invalid verification code");
    }

    const authToken = response.headers.get("Authorization");
    if (authToken) {
      await setToken(authToken);
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Account verified",
      message: "You are now signed in"
    });

    popToRoot();

    return true;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to verify account",
      message: String(error)
    });
    return false;
  }
}
