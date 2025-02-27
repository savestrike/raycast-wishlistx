import { showToast, Toast, LaunchProps } from "@raycast/api";
import { addItem } from "./utils/api";
import { AI } from "@raycast/api";

interface ProductInfo {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
}

export default async function main(props: LaunchProps<{ arguments: { url: string } }>) {
  try {
    await showToast({
      style: Toast.Style.Animated,
      title: "Extracting product details...",
    });

    const productInfo = await extractProductInfo(props.arguments.url);

    await showToast({
      style: Toast.Style.Animated,
      title: "Adding item...",
    });

    const success = await addItem({
      name: productInfo.name,
      description: productInfo.description,
      imageUrl: productInfo.imageUrl,
      targetAmount: productInfo.price?.toString(),
      url: props.arguments.url,
    });

    if (success) {
      showToast({
        style: Toast.Style.Success,
        title: "Item added successfully",
      });
    }
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to add item",
      message: String(error),
    });
  }
}

async function extractProductInfo(url: string): Promise<ProductInfo> {
  const prompt = `Extract product information from this URL: ${url}
    Return a JSON object with these fields:
    - name: product name
    - description: short product description
    - price: price as number without currency
    - imageUrl: direct URL to product image
    Only return the JSON, no other text and no markdown.`;

  const response = await AI.ask(prompt);
  return JSON.parse(response);
}
