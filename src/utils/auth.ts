import fetch, { FormData } from "node-fetch";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { API_BASE_URL } from "./constants";

export async function signIn(phone: string, password: string): Promise<boolean> {
  const formData = new FormData();
  formData.append("phone", phone);
  formData.append("password", password);
  formData.append("device_name", "Raycast");

  try {
    await showToast({
      style: Toast.Style.Animated,
      title: "Signing in..."
    });

    const response = await fetch(`${API_BASE_URL}/auth/sign_in`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 401) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid credentials"
      });
      return false;
    }

    const token = response.headers.get("authorization");
    if (token) {
      await LocalStorage.setItem("wishlistx_auth_token", token);
      await showToast({
        style: Toast.Style.Success,
        title: "Signed in successfully"
      });
      return true;
    }
    return false;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to sign in",
      message: String(error)
    });
    return false;
  }
}

export async function setToken(token: string): Promise<void> {
  await LocalStorage.setItem("wishlistx_auth_token", token);
}

export async function getToken(): Promise<string | undefined> {
  const token = await LocalStorage.getItem("wishlistx_auth_token");
  return token as string | undefined;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== undefined;
}

export async function signOut(): Promise<void> {
  await LocalStorage.removeItem("wishlistx_auth_token");
  await showToast({
    style: Toast.Style.Success,
    title: "Signed out successfully"
  });
}
