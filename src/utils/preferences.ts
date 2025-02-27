import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  phone: string;
  password: string;
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}
