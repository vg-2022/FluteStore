"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductType } from "@/lib/types";
import { Upload, X, Music } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/client";
import {
  createProductAction,
  updateProductAction,
} from "@/app/actions/update-product";
import { useSettings } from "../../settings/_components/settings-provider";

const supabase = createClient();

type Specification = {
  key: string;
  value: string;
};

type Attribute = {
  id: string;
  name: string;
};

// Real functions to interact with Supabase
async function uploadAsset(file: File): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product_media")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload Error:", uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from("product_media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function getAttributes() {
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("category_id, category_name");
  if (catError) console.error("Error fetching categories", catError);

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("tag_id, tag_name");
  if (tagError) console.error("Error fetching tags", tagError);

  return {
    categories:
      categories?.map((c) => ({ id: c.category_id, name: c.category_name })) ||
      [],
    tags: tags?.map((t) => ({ id: t.tag_id, name: t.tag_name })) || [],
  };
}

async function getProductAttributes(productId: string) {
  const { data: categories, error: catError } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", productId);

  const { data: tags, error: tagError } = await supabase
    .from("product_tags")
    .select("tag_id")
    .eq("product_id", productId);

  return {
    categoryIds: categories?.map((c) => c.category_id) || [],
    tagIds: tags?.map((t) => t.tag_id) || [],
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { toast } = useToast();
  const { pdpSettings } = useSettings();

  const [name, setName] = React.useState(product?.productName || "");
  const [description, setDescription] = React.useState(
    product?.description || ""
  );
  const [price, setPrice] = React.useState(product?.price || 0);
  const [mrp, setMrp] = React.useState(product?.mrp);
  const [shippingCostOverride, setShippingCostOverride] = React.useState(
    product?.shippingCostOverride
  );
  const [productType, setProductType] = React.useState<Product["productType"]>(
    product?.productType || pdpSettings.productTypes[0]?.id || ""
  );
  const [stockQuantity, setStockQuantity] = React.useState(
    product?.stockQuantity || 0
  );
  const [stockStatus, setStockStatus] = React.useState<Product["stockStatus"]>(
    product?.stockStatus || "in-stock"
  );

  const [specifications, setSpecifications] = React.useState<Specification[]>(
    product?.specifications
      ? Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value: value as string,
        }))
      : [{ key: "", value: "" }]
  );

  const [allCategories, setAllCategories] = React.useState<Attribute[]>([]);
  const [allTags, setAllTags] = React.useState<Attribute[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<
    string[]
  >([]);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);

  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>(
    product?.imageUrls || []
  );
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [audioPreview, setAudioPreview] = React.useState<string | null>(
    product?.audioUrl || null
  );

  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = React.useState(false);

  React.useEffect(() => {
    const fetchAttributesAndProductData = async () => {
      const { categories, tags } = await getAttributes();
      setAllCategories(categories);
      setAllTags(tags);

      if (product) {
        const { categoryIds, tagIds } = await getProductAttributes(
          product.productId
        );
        setSelectedCategoryIds(categoryIds);
        setSelectedTagIds(tagIds);
      }
    };
    fetchAttributesAndProductData();
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.filter(
        (file) =>
          !imageFiles.some((f) => f.name === file.name && f.size === file.size)
      );
      setImageFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number, previewUrl: string) => {
    const urlToRemove = imagePreviews[index];
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    if (urlToRemove.startsWith("blob:")) {
      const fileIndexToRemove = imageFiles.findIndex(
        (file) => URL.createObjectURL(file) === urlToRemove
      );
      if (fileIndexToRemove > -1) {
        setImageFiles((prev) => prev.filter((_, i) => i !== fileIndexToRemove));
      }
      URL.revokeObjectURL(urlToRemove);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      if (audioPreview && audioPreview.startsWith("blob:")) {
        URL.revokeObjectURL(audioPreview);
      }
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    fileType: "image" | "audio"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (fileType === "image") {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      setImageFiles((prev) => [...prev, ...imageFiles]);
      const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    } else {
      const audioFiles = files.filter((file) => file.type.startsWith("audio/"));
      if (audioFiles[0]) {
        setAudioFile(audioFiles[0]);
        if (audioPreview && audioPreview.startsWith("blob:")) {
          URL.revokeObjectURL(audioPreview);
        }
        setAudioPreview(URL.createObjectURL(audioFiles[0]));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUploadImages = async () => {
    if (imageFiles.length === 0) return;

    setIsUploadingImages(true);
    toast({ title: "Uploading images...", description: "Please wait." });

    try {
      const newImageUploadPromises = imageFiles.map(uploadAsset);
      const uploadedImageUrls = (
        await Promise.all(newImageUploadPromises)
      ).filter((url): url is string => url !== null);

      const existingHttpUrls = imagePreviews.filter((p) =>
        p.startsWith("http")
      );
      setImagePreviews([...existingHttpUrls, ...uploadedImageUrls]);
      setImageFiles([]);

      toast({
        title: "Images uploaded!",
        description: "Image URLs have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile) return;

    setIsUploadingAudio(true);
    toast({ title: "Uploading audio...", description: "Please wait." });

    try {
      const uploadedAudioUrl = await uploadAsset(audioFile);
      if (uploadedAudioUrl) {
        setAudioPreview(uploadedAudioUrl);
        setAudioFile(null);
        toast({
          title: "Audio uploaded!",
          description: "Audio URL has been updated.",
        });
      } else {
        throw new Error("Received a null URL from the asset uploader.");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Audio Upload Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleAddSpec = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    const newSpecs = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecs);
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  const handleCategoryChange = (
    checked: boolean | string,
    categoryId: string
  ) => {
    setSelectedCategoryIds((prev) =>
      checked ? [...prev, categoryId] : prev.filter((c) => c !== categoryId)
    );
  };

  const handleTagChange = (checked: boolean | string, tagId: string) => {
    setSelectedTagIds((prev) =>
      checked ? [...prev, tagId] : prev.filter((t) => t !== tagId)
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (imageFiles.length > 0 || audioFile) {
      toast({
        variant: "destructive",
        title: "Unsaved Media",
        description:
          "You have unsaved media files. Please upload them before saving the product.",
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: "Saving product...",
      description: "Please wait while we save the data.",
    });

    try {
      let finalProductId: string | null = product?.productId || null;

      const newSpecifications = specifications.reduce((acc, spec) => {
        if (spec.key && spec.value) {
          acc[spec.key] = spec.value;
        }
        return acc;
      }, {} as { [key: string]: string });

      const productData = {
        product_name: name,
        description: description,
        price: price,
        product_type: productType,
        specifications: newSpecifications,
        image_urls: imagePreviews,
        audio_url: audioPreview || null,
        mrp: mrp && mrp > 0 ? mrp : null,
        shipping_cost_override:
          shippingCostOverride && shippingCostOverride > 0
            ? shippingCostOverride
            : null,
      };

      const stockData = {
        product_id: finalProductId,
        stock_quantity: stockQuantity,
        stock_status: stockStatus,
      };

      if (finalProductId) {
        // Update existing product, its stock, and its categories/tags
        await updateProductAction(finalProductId, productData, stockData);

        // Update category associations
        const { error: catDeleteError } = await supabase
          .from("product_categories")
          .delete()
          .eq("product_id", finalProductId);
        if (catDeleteError) throw catDeleteError;
        if (selectedCategoryIds.length > 0) {
          const catLinks = selectedCategoryIds.map((catId) => ({
            product_id: finalProductId,
            category_id: catId,
          }));
          const { error: catInsertError } = await supabase
            .from("product_categories")
            .insert(catLinks);
          if (catInsertError) throw catInsertError;
        }

        // Update tag associations
        const { error: tagDeleteError } = await supabase
          .from("product_tags")
          .delete()
          .eq("product_id", finalProductId);
        if (tagDeleteError) throw tagDeleteError;
        if (selectedTagIds.length > 0) {
          const tagLinks = selectedTagIds.map((tagId) => ({
            product_id: finalProductId,
            tag_id: tagId,
          }));
          const { error: tagInsertError } = await supabase
            .from("product_tags")
            .insert(tagLinks);
          if (tagInsertError) throw tagInsertError;
        }
      } else {
        // Create new product
        const savedProduct = await createProductAction(productData);
        if (savedProduct && savedProduct.product_id) {
          finalProductId = savedProduct.product_id;
          // Update stock for the new product
          await supabase
            .from("stock_keeping_units")
            .insert({ ...stockData, product_id: finalProductId });

          // Link categories and tags
          if (selectedCategoryIds.length > 0) {
            const catLinks = selectedCategoryIds.map((catId) => ({
              product_id: finalProductId,
              category_id: catId,
            }));
            await supabase.from("product_categories").insert(catLinks);
          }
          if (selectedTagIds.length > 0) {
            const tagLinks = selectedTagIds.map((tagId) => ({
              product_id: finalProductId,
              tag_id: tagId,
            }));
            await supabase.from("product_tags").insert(tagLinks);
          }
        }
      }

      if (!finalProductId) {
        throw new Error(
          "Failed to get a product ID after saving product details."
        );
      }

      toast({
        title: product ? `Product Updated` : `Product Created`,
        description: `"${name}" has been successfully saved.`,
      });

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploading = isUploadingImages || isUploadingAudio;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      <div className="grid gap-4 md:grid-cols-[1fr_350px]">
        <div className="grid auto-rows-max gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Basic information about the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. C Natural Medium Flute"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short, descriptive summary of the product."
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockStatus">Status</Label>
                <Select
                  value={stockStatus}
                  onValueChange={(value) =>
                    setStockStatus(value as Product["stockStatus"])
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="stockStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="shipping-override">
                  Shipping Cost Override (Optional)
                </Label>
                <Input
                  id="shipping-override"
                  type="number"
                  value={shippingCostOverride || ""}
                  onChange={(e) =>
                    setShippingCostOverride(Number(e.target.value))
                  }
                  placeholder="e.g. 300"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Set a specific shipping cost for this item, otherwise default
                  rates apply.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (INR)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="2500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mrp">MRP (Optional)</Label>
                <Input
                  id="mrp"
                  type="number"
                  value={mrp || ""}
                  onChange={(e) => setMrp(Number(e.target.value))}
                  placeholder="3000"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>
                Add technical details for the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="grid gap-2 flex-grow">
                    <Label htmlFor={`spec-key-${index}`}>Attribute</Label>
                    <Input
                      id={`spec-key-${index}`}
                      value={spec.key}
                      onChange={(e) =>
                        handleSpecChange(index, "key", e.target.value)
                      }
                      placeholder="e.g. Type, Tonic, Material"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2 flex-grow">
                    <Label htmlFor={`spec-value-${index}`}>Value</Label>
                    <Input
                      id={`spec-value-${index}`}
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecChange(index, "value", e.target.value)
                      }
                      placeholder="e.g. A440Hz"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSpec(index)}
                    className="shrink-0"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSpec}
                className="mt-2"
                disabled={isSubmitting}
              >
                Add Specification
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Organize</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={productType}
                    onValueChange={(value) => setProductType(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="productType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {pdpSettings.productTypes.map((type: ProductType) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="categories">
                    <AccordionTrigger className="text-sm font-medium">
                      Categories
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 max-h-48 overflow-y-auto p-1">
                        {allCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={selectedCategoryIds.includes(cat.id)}
                              onCheckedChange={(checked) =>
                                handleCategoryChange(checked, cat.id)
                              }
                            />
                            <Label
                              htmlFor={`cat-${cat.id}`}
                              className="font-normal text-sm"
                            >
                              {cat.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tags">
                    <AccordionTrigger className="text-sm font-medium">
                      Tags
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 max-h-48 overflow-y-auto p-1">
                        {allTags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTagIds.includes(tag.id)}
                              onCheckedChange={(checked) =>
                                handleTagChange(checked, tag.id)
                              }
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="font-normal text-sm"
                            >
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Media</CardTitle>
              <CardDescription>
                Upload images and an audio sample for the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product Images</Label>
                <div
                  onDrop={(e) => handleDrop(e, "image")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "mt-2 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center",
                    isDragging && "border-primary"
                  )}
                >
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer w-full"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop images here, or click to browse
                    </p>
                  </label>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className="relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index}`}
                          width={100}
                          height={100}
                          className="rounded-md object-cover w-full aspect-square"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => handleRemoveImage(index, preview)}
                          disabled={isUploading || isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {imageFiles.length > 0 && (
                  <Button
                    type="button"
                    className="w-full mt-4"
                    onClick={handleUploadImages}
                    disabled={isUploadingImages}
                  >
                    {isUploadingImages
                      ? "Uploading..."
                      : `Upload ${imageFiles.length} Image(s)`}
                  </Button>
                )}
              </div>
              <div className="border-t pt-4">
                <Label>Audio Sample</Label>
                <div
                  onDrop={(e) => handleDrop(e, "audio")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "mt-2 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center",
                    isDragging && "border-primary"
                  )}
                >
                  <label
                    htmlFor="audio-upload"
                    className="cursor-pointer w-full"
                  >
                    <Music className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop audio file here, or click to browse
                    </p>
                  </label>
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </div>
                {audioPreview && (
                  <div className="mt-2">
                    <audio controls src={audioPreview} className="w-full" />
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        setAudioFile(null);
                        setAudioPreview(null);
                      }}
                      disabled={isUploading}
                    >
                      Remove audio
                    </Button>
                  </div>
                )}
                {audioFile && (
                  <Button
                    type="button"
                    className="w-full mt-4"
                    onClick={handleUploadAudio}
                    disabled={isUploadingAudio}
                  >
                    {isUploadingAudio ? "Uploading..." : "Upload Audio"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting
            ? "Saving..."
            : product
            ? "Update Product"
            : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
