import { Grid, ActionPanel, Action } from "@raycast/api";
import { SavedItem, Wishlist } from "../utils/api";
import { WishlistActions } from "./WishlistActions";

interface SavedItemsGridProps {
  items: SavedItem[];
  wishlists: Wishlist[];
  isLoading?: boolean;
  currentWishlistId?: number;
  onUpdate: (itemId: number, targetWishlistId: number | null) => void;
  searchBarAccessory?: JSX.Element;
}

export function SavedItemsGrid({
  items,
  wishlists,
  isLoading,
  currentWishlistId,
  onUpdate,
  searchBarAccessory
}: SavedItemsGridProps) {
  return (
    <Grid
      columns={4}
      inset={Grid.Inset.Zero}
      isLoading={isLoading}
      searchBarAccessory={searchBarAccessory}
    >
      {items.map((item: SavedItem) => (
        <Grid.Item
          key={item.id}
          content={item.image?.url ? { source: item.image.url } : { source: "placeholder.png"}}
          title={item.name}
          subtitle={`${parseFloat(item.target_amount).toLocaleString()} €`}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={item.tracking_url || item.url} />
              <Action.CopyToClipboard content={item.url} />
              <WishlistActions
                item={item}
                wishlists={wishlists}
                currentWishlistId={currentWishlistId}
                onUpdate={(targetWishlistId) => onUpdate(item.id, targetWishlistId)}
              />
            </ActionPanel>
          }
        />
      ))}
    </Grid>
  );
}
