'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Attribute = {
    id: string;
    name: string;
}

async function getAttributes() {
    const { data: categories, error: catError } = await supabase.from('categories').select('category_id, category_name');
    if (catError) console.error("Error fetching categories", catError);
    
    const { data: tags, error: tagError } = await supabase.from('tags').select('tag_id, tag_name');
    if (tagError) console.error("Error fetching tags", tagError);

    return {
        categories: categories?.map(c => ({ id: c.category_id, name: c.category_name })) || [],
        tags: tags?.map(t => ({ id: t.tag_id, name: t.tag_name })) || []
    }
}


export default function AttributesPage() {
    const { toast } = useToast();
    const [allCategories, setAllCategories] = React.useState<Attribute[]>([]);
    const [allTags, setAllTags] = React.useState<Attribute[]>([]);
    const [newCategory, setNewCategory] = React.useState('');
    const [newTag, setNewTag] = React.useState('');
    const [itemToDelete, setItemToDelete] = React.useState<{ type: 'category' | 'tag', item: Attribute } | null>(null);

    const fetchAttributes = React.useCallback(async () => {
        const { categories, tags } = await getAttributes();
        setAllCategories(categories.sort((a,b) => a.name.localeCompare(b.name)));
        setAllTags(tags.sort((a,b) => a.name.localeCompare(b.name)));
    }, []);

    React.useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const handleAdd = async (type: 'category' | 'tag') => {
        const name = type === 'category' ? newCategory : newTag;
        if (!name) return;

        const table = type === 'category' ? 'categories' : 'tags';
        const nameCol = type === 'category' ? 'category_name' : 'tag_name';
        const idCol = type === 'category' ? 'category_id' : 'tag_id';
        
        const { data, error } = await supabase.from(table).insert({ [nameCol]: name }).select().single();

        if (error) {
            toast({ variant: 'destructive', title: `Error adding ${type}`, description: error.message });
        } else {
            const newItem = { id: data[idCol], name: data[nameCol] };
            if (type === 'category') {
                setAllCategories(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCategory('');
            } else {
                setAllTags(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
                setNewTag('');
            }
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} added` });
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        
        const table = itemToDelete.type === 'category' ? 'categories' : 'tags';
        const idCol = itemToDelete.type === 'category' ? 'category_id' : 'tag_id';
        const { error } = await supabase.from(table).delete().eq(idCol, itemToDelete.item.id);

        if (error) {
            toast({ variant: 'destructive', title: `Error deleting ${itemToDelete.type}`, description: error.message });
        } else {
            if (itemToDelete.type === 'category') {
                setAllCategories(prev => prev.filter(cat => cat.id !== itemToDelete.item.id));
            } else {
                setAllTags(prev => prev.filter(tag => tag.id !== itemToDelete.item.id));
            }
            toast({ title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} deleted` });
        }
        setItemToDelete(null);
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Add, view, or remove product categories.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex w-full items-center space-x-2">
                        <div className="flex-grow grid gap-1.5">
                            <Label htmlFor="new-category" className="sr-only">New Category</Label>
                            <Input id="new-category" placeholder="e.g. Professional Flutes" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                        </div>
                        <Button type="button" onClick={() => handleAdd('category')}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t pt-4">
                        {allCategories.length > 0 ? allCategories.map(cat => (
                            <Badge key={cat.id} variant="secondary" className="text-sm font-normal">
                                {cat.name}
                                <button onClick={() => setItemToDelete({ type: 'category', item: cat })} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        )) : <p className="text-sm text-muted-foreground">No categories yet.</p>}
                    </div>
                </CardContent>
            </Card>
        </AnimateOnScroll>
        <AnimateOnScroll>
             <Card>
                <CardHeader>
                    <CardTitle>Manage Tags</CardTitle>
                    <CardDescription>Add, view, or remove product tags.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex w-full items-center space-x-2">
                        <div className="flex-grow grid gap-1.5">
                            <Label htmlFor="new-tag" className="sr-only">New Tag</Label>
                            <Input id="new-tag" placeholder="e.g. Best Seller" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                        </div>
                        <Button type="button" onClick={() => handleAdd('tag')}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                    </div>
                     <div className="flex flex-wrap gap-2 border-t pt-4">
                        {allTags.length > 0 ? allTags.map(tag => (
                            <Badge key={tag.id} variant="secondary" className="text-sm font-normal">
                                {tag.name}
                                <button onClick={() => setItemToDelete({ type: 'tag', item: tag })} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        )) : <p className="text-sm text-muted-foreground">No tags yet.</p>}
                    </div>
                </CardContent>
            </Card>
        </AnimateOnScroll>
        
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the {itemToDelete?.type} "{itemToDelete?.item.name}" from your store. This will also remove it from all associated products. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
