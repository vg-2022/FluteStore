
import placeholderData from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = placeholderData.PlaceHolderImages;

// A helper function to find an image. It can handle blob URLs directly.
export function findImageById(id: string): ImagePlaceholder | undefined {
  if (!id) {
    return undefined;
  }
  if (id.startsWith('blob:') || id.startsWith('data:')) {
    return {
      id: id,
      description: "User uploaded image",
      imageUrl: id,
      imageHint: "uploaded image"
    };
  }
  return PlaceHolderImages.find(p => p.id === id);
}
