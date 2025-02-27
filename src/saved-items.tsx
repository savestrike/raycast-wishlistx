import { useState } from "react";
import { Grid } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { getSavedItems, getWishlists, type SavedItem } from "./utils/api";
import { SavedItemsGrid } from "./components/SavedItemsGrid";

interface SavedItemsProps {
  initialWishlistId?: number;
}

export default function Command({ initialWishlistId }: Readonly<SavedItemsProps>) {
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | undefined>(initialWishlistId);
  const [localItems, setLocalItems] = useState<SavedItem[]>([]);

  const { data: wishlists = [], revalidate: revalidateWishlists } = useCachedPromise(getWishlists, []);
  const { isLoading, data: saved_items } = useCachedPromise(
    async (wishlistId: number | undefined) => {
      const response = await getSavedItems(wishlistId);
      setLocalItems(response.data);
      return response;
    },
    [selectedWishlistId]
  );

  const handleUpdate = (itemId: number, targetWishlistId: number | null) => {
    // Optimistically update local state
    setLocalItems(prev => {
      if (targetWishlistId === null) {
        // For delete operations, remove the item completely
        if (!selectedWishlistId) {
          return prev.filter(item => item.id !== itemId);
        }
        // For wishlist removal, just update the wishlist_id
        return prev.map(item => {
          if (item.id === itemId) {
            return { ...item, wishlist_id: undefined };
          }
          return item;
        }).filter(item => {
          // Remove from current wishlist view
          if (selectedWishlistId) {
            return item.wishlist_id === selectedWishlistId;
          }
          return true;
        });
      }

      // For moving to another wishlist
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, wishlist_id: targetWishlistId };
        }
        return item;
      }).filter(item => {
        // Remove from current wishlist view if moved out
        if (selectedWishlistId) {
          return item.wishlist_id === selectedWishlistId;
        }
        return true;
      });
    });

    // Refresh wishlists in background
    revalidateWishlists();
  };

  // Filter items based on selected wishlist
  const items = (localItems.length > 0 ? localItems : saved_items?.data || [])
    .filter(item => {
      if (selectedWishlistId) {
        return item.wishlist_id === selectedWishlistId;
      }
      return true;
    });

  return (
    <SavedItemsGrid
      items={items}
      wishlists={wishlists}
      isLoading={isLoading}
      currentWishlistId={selectedWishlistId}
      onUpdate={handleUpdate}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Select Wishlist"
          storeValue={false}
          value={selectedWishlistId?.toString() ?? ""}
          onChange={(newValue) => setSelectedWishlistId(newValue ? parseInt(newValue) : undefined)}
        >
          <Grid.Dropdown.Item title="All Items" value="" />
          {wishlists.map((wishlist) => (
            <Grid.Dropdown.Item
              key={wishlist.id}
              title={`${wishlist.name} (${wishlist.count})`}
              value={wishlist.id.toString()}
            />
          ))}
        </Grid.Dropdown>
      }
    />
  );
}
