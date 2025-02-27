import { Action, ActionPanel, Icon, showToast, Toast } from "@raycast/api";
import { SavedItem, Wishlist, updateFavoriteWishlist, deleteFavorite } from "../utils/api";

interface WishlistActionsProps {
  item: SavedItem;
  wishlists: Wishlist[];
  currentWishlistId?: number;
  onUpdate: (targetWishlistId: number | null) => void;
}

export function WishlistActions({ item, wishlists, currentWishlistId, onUpdate }: WishlistActionsProps) {
  const handleWishlistUpdate = async (wishlistId: number | null) => {
    const success = await updateFavoriteWishlist(item.id, wishlistId, currentWishlistId, wishlists);
    if (success) {
      onUpdate(wishlistId);
    }
  };

  const deleteAction = (
    <Action
      icon={Icon.Trash}
      title="Delete Item"
      shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
      onAction={async () => {
        // Optimistically update UI
        onUpdate(null);

        const success = await deleteFavorite(item.id);
        if (!success) {
          // Show error and let parent component handle refresh
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed to delete item",
            message: "The item will reappear shortly"
          });
        }
      }}
    />
  );

  if (currentWishlistId) {
    return (
      <>
        <Action
          icon={Icon.XmarkCircle}
          title="Remove from Wishlist"
          shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
          onAction={() => handleWishlistUpdate(null)}
        />
        {deleteAction}
        {wishlists.length > 1 && (
          <ActionPanel.Submenu icon={Icon.ArrowRight} title="Move to Wishlist" shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}>
            {wishlists
              .filter((w) => w.id !== currentWishlistId)
              .map((wishlist) => (
                <Action
                  key={wishlist.id}
                  icon={Icon.List}
                  title={wishlist.name}
                  onAction={() => handleWishlistUpdate(wishlist.id)}
                />
              ))}
          </ActionPanel.Submenu>
        )}
      </>
    );
  }

  return (
    <>
      <ActionPanel.Submenu icon={Icon.Plus} title="Add to Wishlist" shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}>
        {wishlists.map((wishlist) => (
          <Action
            key={wishlist.id}
            icon={Icon.List}
            title={wishlist.name}
            onAction={() => handleWishlistUpdate(wishlist.id)}
          />
        ))}
      </ActionPanel.Submenu>
      {deleteAction}
    </>
  );
}
