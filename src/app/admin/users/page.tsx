
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboardData } from "@/app/actions/get-admin-dashboard-data";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Ban, Trash2, Edit, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserForm } from "./_components/user-form";
import { deleteUser, banUser, unbanUser } from "@/app/actions/user-management";
import { Input } from "@/components/ui/input";

interface AdminUser extends User {
    user_metadata: {
        avatar_url?: string;
        first_name?: string;
        last_name?: string;
        is_admin?: boolean;
    },
    banned_until?: string;
}

function UserRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToBan, setUserToBan] = useState<AdminUser | null>(null);
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { users: fetchedUsers } = await getAdminDashboardData();
             const mappedUsers = fetchedUsers.map((user: any) => ({
                ...user,
                email: user.email || 'No email',
                user_metadata: {
                    first_name: user.user_metadata?.first_name,
                    last_name: user.user_metadata?.last_name,
                    avatar_url: user.user_metadata?.avatar_url,
                    is_admin: user.user_metadata?.is_admin,
                },
                banned_until: user.banned_until,
            }));
            setUsers(mappedUsers as AdminUser[]);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({ variant: "destructive", title: "Error fetching users", description: (error as Error).message });
            setUsers([]);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user => 
            (user.user_metadata.first_name && user.user_metadata.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.user_metadata.last_name && user.user_metadata.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, searchTerm]);

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingUser(null);
        fetchUsers();
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            toast({ title: "User Deleted", description: "The user has been permanently removed." });
            setUserToDelete(null);
            fetchUsers();
        } catch(e) {
            toast({ variant: "destructive", title: "Error deleting user", description: (e as Error).message });
        }
    };
    
    const handleBan = async () => {
        if (!userToBan) return;
        const isBanned = userToBan.banned_until && new Date(userToBan.banned_until) > new Date();
        try {
            if (isBanned) {
                await unbanUser(userToBan.id);
                toast({ title: "User Unbanned" });
            } else {
                await banUser(userToBan.id, 'forever');
                toast({ title: "User Banned" });
            }
            setUserToBan(null);
            fetchUsers();
        } catch(e) {
            toast({ variant: "destructive", title: "Error updating ban status", description: (e as Error).message });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-muted-foreground">Manage your customers and administrators.</p>
                </div>
                <div className="flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users in your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Last Sign In</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    {[...Array(3)].map((_, i) => <UserRowSkeleton key={i} />)}
                                </>
                            ) : (
                                filteredUsers.map(user => {
                                    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                                    return (
                                        <TableRow key={user.id} className={isBanned ? 'bg-destructive/10' : ''}>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={user.user_metadata.avatar_url} />
                                                        <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.user_metadata.first_name} {user.user_metadata.last_name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.user_metadata.is_admin ? 'default' : 'secondary'}>
                                                    {user.user_metadata.is_admin ? 'Admin' : 'Customer'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={isBanned ? 'destructive' : 'default'}>
                                                    {isBanned ? 'Banned' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => { setEditingUser(user); setIsFormOpen(true); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setUserToBan(user)}>
                                                            <Ban className="mr-2 h-4 w-4" /> {isBanned ? 'Unban' : 'Ban'} User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setUserToDelete(user)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                            {!loading && filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(open) => {
                if (!open) setEditingUser(null);
                setIsFormOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    </DialogHeader>
                    <UserForm user={editingUser} onSuccess={handleFormSuccess} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user and all their associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete User</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!userToBan} onOpenChange={() => setUserToBan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {userToBan?.banned_until && new Date(userToBan.banned_until) > new Date() ? 'unban' : 'ban'} this user?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBan}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
