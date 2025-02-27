import fetch, { FormData } from "node-fetch";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { API_BASE_URL } from "./constants";
import { getPreferences } from "./preferences";

export async function signIn(): Promise<boolean> {
  const { phone, password } = getPreferences();

  const formData = new FormData();
  formData.append("phone", phone);
  formData.append("password", password);
  formData.append("device_name", "Raycast");

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sign_in`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 401) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid credentials",
        message: "Please check your phone and password in preferences"
      });
      return false;    }

    const token = response.headers.get("authorization");

    if (token) {
      await LocalStorage.setItem("wishlistx_auth_token", token);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
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
}
