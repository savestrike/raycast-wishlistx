import { List, ActionPanel, Action, confirmAlert, useNavigation, Alert, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { getWishlists, deleteWishlist, shareWishlist } from "./utils/api";
import SavedItems from "./saved-items";

export default function Command() {
  const { data: wishlists = [], revalidate } = useCachedPromise(getWishlists, []);
  const { push } = useNavigation();

  const handleDelete = async (wishlistId: number, wishlistName: string) => {
    const options = {
      title: `Delete "${wishlistName}"?`,
      message: "The items will be removed from this wishlist but will remain in your saved items.",
      primaryAction: {
        title: "Delete Wishlist",
        style: Alert.ActionStyle.Destructive,
      }
    };

    const alert = await confirmAlert(options);

    if (alert) {
      await deleteWishlist(wishlistId, false);
      revalidate();
    }
  };

  return (
    <List>
      {wishlists.map((wishlist) => (
        <List.Item
          key={wishlist.id}
          title={wishlist.name}
          subtitle={`${wishlist.count} items`}
          actions={
            <ActionPanel>
              <Action
                title="Open Wishlist"
                onAction={() => {
                  push(<SavedItems initialWishlistId={wishlist.id} />);
                }}
              />
              <Action
                title="Share Wishlist"
                icon={Icon.Link}
                shortcut={{ modifiers: ["cmd"], key: "s" }}
                onAction={() => shareWishlist(wishlist.id, wishlist.name)}
              />
              <Action
                title="Delete Wishlist"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                onAction={() => handleDelete(wishlist.id, wishlist.name)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
