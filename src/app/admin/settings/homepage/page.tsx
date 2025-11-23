"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  GripVertical,
  Settings as SettingsIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type {
  Product,
  Testimonial,
  Promotion,
  HomepageCollectionCard,
  HomepageCategoryCard,
  HomepageSection,
  SectionType,
} from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { findImageById } from "@/lib/placeholder-images";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/products";
import { useSettings } from "../_components/settings-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const addableSectionTypes: { value: SectionType; label: string }[] = [
  { value: "featuredProducts", label: "Featured Products Carousel" },
  { value: "newArrivals", label: "New Arrivals Carousel" },
  { value: "accessories", label: "Accessories Carousel" },
  { value: "collections", label: "Collection Cards" },
  { value: "categories", label: "Category Cards" },
  { value: "testimonials", label: "Testimonials Slider" },
  { value: "specialOffers", label: "Special Offer Banners" },
];

function createNewSection(type: SectionType): HomepageSection {
  const base = {
    id: `${type}-${Date.now()}`,
    type,
    title:
      addableSectionTypes.find((t) => t.value === type)?.label || "New Section",
    visible: true,
  };

  switch (type) {
    case "featuredProducts":
    case "newArrivals":
    case "accessories":
    case "hero":
      return { ...base, data: { productIds: [], promotions: [] } };
    case "collections":
      return { ...base, data: { cards: [] as HomepageCollectionCard[] } };
    case "categories":
      return { ...base, data: { cards: [] as HomepageCategoryCard[] } };
    case "testimonials":
      return { ...base, data: { testimonials: [] as Testimonial[] } };
    case "specialOffers":
      return { ...base, data: { promotions: [] as Promotion[] } };
    default:
      return { ...base, data: {} } as HomepageSection;
  }
}

function HomepageSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

export default function HomepageSettingsPage() {
  const { toast } = useToast();
  const { saveSettings, isLoading, homepageSections } = useSettings();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [draggedSection, setDraggedSection] = useState<
    HomepageSection["id"] | null
  >(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState<SectionType | "">("");
  const [sectionToDelete, setSectionToDelete] =
    useState<HomepageSection | null>(null);

  const [localHomepageSections, setLocalHomepageSections] = useState<
    HomepageSection[]
  >([]);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(
    null
  );

  useEffect(() => {
    const fetchProducts = async () => {
      const products = await getProducts();
      setAllProducts(products);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLocalHomepageSections(homepageSections);
    }
  }, [isLoading, homepageSections]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) =>
      p.productName.toLowerCase().includes(currentSearchTerm.toLowerCase())
    );
  }, [allProducts, currentSearchTerm]);

  const handleSectionDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    section: HomepageSection
  ) => {
    setDraggedSection(section.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSectionDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetSection: HomepageSection
  ) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSection.id) return;

    const newSections = Array.from(localHomepageSections);
    const draggedIndex = newSections.findIndex((s) => s.id === draggedSection);
    const targetIndex = newSections.findIndex((s) => s.id === targetSection.id);

    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    setLocalHomepageSections(newSections);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
  };

  const handleSectionUpdate = (
    id: HomepageSection["id"],
    field: "title" | "visible",
    value: string | boolean
  ) => {
    setLocalHomepageSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleProductSelectionToggle = (productId: string) => {
    if (!editingSection) return;

    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && "productIds" in s.data) {
          const currentIds = s.data.productIds || [];
          const newIds = currentIds.includes(productId)
            ? currentIds.filter((id) => id !== productId)
            : [...currentIds, productId];
          return { ...s, data: { ...s.data, productIds: newIds } };
        }
        return s;
      })
    );
  };

  const handleAddPromotion = () => {
    if (!editingSection || editingSection.type !== "hero") return;

    const newPromotion: Promotion = {
      id: Date.now(),
      name: "",
      info: "",
      imageUrl: "",
      imageHint: "new promotion",
    };

    setLocalHomepageSections((prevSections) => {
      const newSections = [...prevSections];
      const sectionIndex = newSections.findIndex(
        (s) => s.id === editingSection.id
      );
      if (sectionIndex > -1 && newSections[sectionIndex].type === "hero") {
        const section = newSections[sectionIndex];
        const existingPromos = Array.isArray(section.data.promotions)
          ? section.data.promotions
          : [];
        const updatedPromotions = [...existingPromos, newPromotion];
        newSections[sectionIndex] = {
          ...section,
          data: { ...section.data, promotions: updatedPromotions },
        };
      }
      return newSections;
    });
  };

  const handleRemovePromotion = (index: number) => {
    if (!editingSection || editingSection.type !== "hero") return;

    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && s.type === "hero") {
          const updatedPromotions = (s.data.promotions || []).filter(
            (_, i) => i !== index
          );
          return { ...s, data: { ...s.data, promotions: updatedPromotions } };
        }
        return s;
      })
    );
  };

  const handlePromotionUpdate = (
    index: number,
    field: keyof Promotion,
    value: string
  ) => {
    if (!editingSection || editingSection.type !== "hero") return;

    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && s.type === "hero") {
          const updatedPromotions = [...(s.data.promotions || [])];
          updatedPromotions[index] = {
            ...updatedPromotions[index],
            [field]: value,
          };
          return { ...s, data: { ...s.data, promotions: updatedPromotions } };
        }
        return s;
      })
    );
  };

  const handlePromotionImageUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePromotionUpdate(index, "imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewSection = () => {
    if (!newSectionType) {
      toast({ variant: "destructive", title: "Please select a section type." });
      return;
    }
    const newSection = createNewSection(newSectionType);
    setLocalHomepageSections((prev) => [...prev, newSection]);
    setIsAddSectionDialogOpen(false);
    setNewSectionType("");
  };

  const handleDeleteSection = () => {
    if (!sectionToDelete) return;
    setLocalHomepageSections((prev) =>
      prev.filter((s) => s.id !== sectionToDelete.id)
    );
    setSectionToDelete(null);
  };

  const handleTestimonialChange = (
    index: number,
    field: keyof Testimonial,
    value: any
  ) => {
    if (!editingSection || editingSection.type !== "testimonials") return;

    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && s.type === "testimonials") {
          const updatedTestimonials = [...(s.data.testimonials || [])];
          updatedTestimonials[index] = {
            ...updatedTestimonials[index],
            [field]: value,
          };
          return {
            ...s,
            data: { ...s.data, testimonials: updatedTestimonials },
          };
        }
        return s;
      })
    );
  };

  const handleAddTestimonial = () => {
    if (!editingSection || editingSection.type !== "testimonials") return;
    const newTestimonial: Testimonial = {
      id: Date.now(),
      name: "",
      location: "",
      comment: "",
      imageUrl: "",
      imageHint: "",
    };

    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && s.type === "testimonials") {
          const updatedTestimonials = [
            ...(s.data.testimonials || []),
            newTestimonial,
          ];
          return {
            ...s,
            data: { ...s.data, testimonials: updatedTestimonials },
          };
        }
        return s;
      })
    );
  };

  const handleRemoveTestimonial = (index: number) => {
    if (!editingSection || editingSection.type !== "testimonials") return;
    setLocalHomepageSections((prevSections) =>
      prevSections.map((s) => {
        if (s.id === editingSection.id && s.type === "testimonials") {
          const updatedTestimonials = (s.data.testimonials || []).filter(
            (_, i) => i !== index
          );
          return {
            ...s,
            data: { ...s.data, testimonials: updatedTestimonials },
          };
        }
        return s;
      })
    );
  };

  const handleSaveHomepage = async () => {
    try {
      await saveSettings({ homepageSections: localHomepageSections });
      toast({ title: "Homepage sections saved!" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error saving homepage",
        description: (e as Error).message,
      });
    }
  };

  useEffect(() => {
    if (editingSection) {
      setEditingSection(
        localHomepageSections.find((s) => s.id === editingSection.id) || null
      );
    }
  }, [localHomepageSections, editingSection]);

  if (isLoading) {
    return <HomepageSettingsSkeleton />;
  }

  const currentEditingSectionData = localHomepageSections.find(
    (s) => s.id === editingSection?.id
  );

  return (
    <AnimateOnScroll>
      <Card>
        <CardHeader>
          <CardTitle>Homepage Section Management</CardTitle>
          <CardDescription>
            Drag to reorder, toggle visibility, and edit content for homepage
            sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {localHomepageSections.map((section) => (
            <div
              key={section.id}
              draggable={section.type !== "hero"}
              onDragStart={(e) =>
                section.type !== "hero" && handleSectionDragStart(e, section)
              }
              onDragOver={(e) =>
                section.type !== "hero" && handleSectionDragOver(e, section)
              }
              onDragEnd={handleSectionDragEnd}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 bg-muted/20",
                section.type !== "hero"
                  ? "cursor-grab"
                  : "cursor-not-allowed opacity-70",
                draggedSection === section.id &&
                  "opacity-50 ring-2 ring-primary"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                value={section.title}
                onChange={(e) =>
                  handleSectionUpdate(section.id, "title", e.target.value)
                }
                className="flex-grow bg-background text-sm"
              />
              <Dialog
                onOpenChange={(open) => {
                  if (!open) setEditingSection(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSection(section)}
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Manage Content
                  </Button>
                </DialogTrigger>
                {editingSection?.id === section.id && (
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>
                        Manage Content for: {currentEditingSectionData?.title}
                      </DialogTitle>
                      <DialogDescription>
                        Select content to appear in this section.
                      </DialogDescription>
                    </DialogHeader>

                    {currentEditingSectionData?.type === "hero" ? (
                      <Tabs defaultValue="products">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="products">Products</TabsTrigger>
                          <TabsTrigger value="promotions">
                            Promotions
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="products">
                          <div className="relative my-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search products..."
                              className="pl-10"
                              value={currentSearchTerm}
                              onChange={(e) =>
                                setCurrentSearchTerm(e.target.value)
                              }
                            />
                          </div>
                          <ScrollArea className="h-72 border rounded-md">
                            <div className="grid gap-2 p-4">
                              {filteredProducts.map((product) => (
                                <div
                                  key={product.productId}
                                  className="flex items-center space-x-3"
                                >
                                  <Checkbox
                                    id={`${currentEditingSectionData.id}-product-${product.productId}`}
                                    checked={(
                                      "productIds" in
                                        (currentEditingSectionData.data ||
                                          {}) &&
                                      (currentEditingSectionData.data
                                        .productIds ||
                                        [])
                                    ).includes(product.productId)}
                                    onCheckedChange={() =>
                                      handleProductSelectionToggle(
                                        product.productId
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${currentEditingSectionData.id}-product-${product.productId}`}
                                    className="font-normal text-sm cursor-pointer"
                                  >
                                    {product.productName}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        <TabsContent value="promotions">
                          <ScrollArea className="h-[60vh] pr-6 -mr-6 mt-4">
                            <div className="space-y-4">
                              {(
                                ("promotions" in
                                  currentEditingSectionData.data &&
                                  currentEditingSectionData.data.promotions) ||
                                []
                              ).map((promo: Promotion, index: number) => (
                                <Card key={promo.id || index}>
                                  <CardContent className="p-4 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`promo-name-${index}`}>
                                        Title
                                      </Label>
                                      <Input
                                        id={`promo-name-${index}`}
                                        value={promo.name}
                                        onChange={(e) =>
                                          handlePromotionUpdate(
                                            index,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`promo-info-${index}`}>
                                        Info Text
                                      </Label>
                                      <Input
                                        id={`promo-info-${index}`}
                                        value={promo.info}
                                        onChange={(e) =>
                                          handlePromotionUpdate(
                                            index,
                                            "info",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                      <Label
                                        htmlFor={`promo-imageUrl-${index}`}
                                      >
                                        Image (URL or Upload)
                                      </Label>
                                      <Input
                                        id={`promo-imageUrl-${index}`}
                                        value={promo.imageUrl}
                                        onChange={(e) =>
                                          handlePromotionUpdate(
                                            index,
                                            "imageUrl",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Paste image URL here"
                                      />
                                      <div className="text-xs text-muted-foreground text-center my-1">
                                        OR
                                      </div>
                                      <Input
                                        id={`promo-img-upload-${index}`}
                                        type="file"
                                        accept="image/*"
                                        className="text-xs"
                                        onChange={(e) =>
                                          handlePromotionImageUpload(index, e)
                                        }
                                      />
                                      {promo.imageUrl && (
                                        <Image
                                          src={promo.imageUrl}
                                          alt="preview"
                                          width={120}
                                          height={67}
                                          className="rounded-md object-cover mt-2"
                                        />
                                      )}
                                    </div>
                                  </CardContent>
                                  <CardFooter>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleRemovePromotion(index)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                              <Button
                                onClick={handleAddPromotion}
                                variant="outline"
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" /> Add Promotion
                              </Button>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    ) : "productIds" in
                      (currentEditingSectionData?.data || {}) ? (
                      <>
                        <div className="relative my-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search products..."
                            className="pl-10"
                            value={currentSearchTerm}
                            onChange={(e) =>
                              setCurrentSearchTerm(e.target.value)
                            }
                          />
                        </div>
                        <ScrollArea className="h-72 border rounded-md">
                          <div className="grid gap-2 p-4">
                            {filteredProducts.map((product) => (
                              <div
                                key={product.productId}
                                className="flex items-center space-x-3"
                              >
                                <Checkbox
                                  id={`${currentEditingSectionData?.id}-product-${product.productId}`}
                                  checked={(
                                    ("productIds" in
                                      (currentEditingSectionData?.data || {}) &&
                                      (currentEditingSectionData?.data as any)
                                        .productIds) ||
                                    []
                                  ).includes(product.productId)}
                                  onCheckedChange={() =>
                                    handleProductSelectionToggle(
                                      product.productId
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${currentEditingSectionData?.id}-product-${product.productId}`}
                                  className="font-normal text-sm cursor-pointer"
                                >
                                  {product.productName}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    ) : currentEditingSectionData?.type === "testimonials" &&
                      "testimonials" in currentEditingSectionData.data ? (
                      <ScrollArea className="h-[60vh] pr-6 -mr-6 mt-4">
                        <div className="space-y-4">
                          {currentEditingSectionData.data.testimonials.map(
                            (testimonial, index) => (
                              <Card key={testimonial.id || index}>
                                <CardContent className="p-4 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Name</Label>
                                      <Input
                                        value={testimonial.name}
                                        onChange={(e) =>
                                          handleTestimonialChange(
                                            index,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Location</Label>
                                      <Input
                                        value={testimonial.location}
                                        onChange={(e) =>
                                          handleTestimonialChange(
                                            index,
                                            "location",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Comment</Label>
                                    <Textarea
                                      value={testimonial.comment}
                                      onChange={(e) =>
                                        handleTestimonialChange(
                                          index,
                                          "comment",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Image ID</Label>
                                    <Input
                                      value={testimonial.imageUrl}
                                      onChange={(e) =>
                                        handleTestimonialChange(
                                          index,
                                          "imageUrl",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g. user-1"
                                    />
                                  </div>
                                </CardContent>
                                <CardFooter>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveTestimonial(index)
                                    }
                                  >
                                    Remove
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          )}
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleAddTestimonial}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Testimonial
                          </Button>
                        </div>
                      </ScrollArea>
                    ) : (
                      <div>
                        Content management for this section type is not
                        implemented yet.
                      </div>
                    )}
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button type="button">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                )}
              </Dialog>
              <Switch
                checked={section.visible}
                onCheckedChange={(checked) =>
                  handleSectionUpdate(section.id, "visible", checked)
                }
                className="ml-auto"
              />
              {section.type !== "hero" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setSectionToDelete(section)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Dialog
            open={isAddSectionDialogOpen}
            onOpenChange={setIsAddSectionDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Homepage Section</DialogTitle>
                <DialogDescription>
                  Choose a new section type to add to your homepage layout.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="section-type">Section Type</Label>
                <Select
                  value={newSectionType}
                  onValueChange={(v) => setNewSectionType(v as SectionType)}
                >
                  <SelectTrigger id="section-type">
                    <SelectValue placeholder="Select a section type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {addableSectionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleAddNewSection}>
                  Add Section
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveHomepage}>Save Homepage Sections</Button>
        </CardFooter>
      </Card>

      <AlertDialog
        open={!!sectionToDelete}
        onOpenChange={() => setSectionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the "{sectionToDelete?.title}"
              section from your homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimateOnScroll>
  );
}
