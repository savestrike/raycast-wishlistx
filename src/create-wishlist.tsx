import { LaunchProps, showToast, Toast } from "@raycast/api";
import { createWishlist } from "./utils/api";

export default async function Command(props: LaunchProps<{ arguments: { name: string } }>) {
  const { name } = props.arguments;

  try {
    await showToast({
      style: Toast.Style.Animated,
      title: "Creating wishlist..."
    });

    await createWishlist(name);
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to create wishlist",
      message: String(error),
    });
  }
}
