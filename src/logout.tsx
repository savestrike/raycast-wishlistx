import { confirmAlert, Alert, popToRoot } from "@raycast/api";
import { signOut } from "./utils/auth";

export default async function Command() {
  const options: Alert.Options = {
    title: "Sign Out",
    message: "Are you sure you want to sign out?",
    primaryAction: {
      title: "Sign Out",
      style: Alert.ActionStyle.Destructive,
    },
  };

  const confirmed = await confirmAlert(options);
  if (confirmed) {
    await signOut();
    popToRoot();
  }
}
