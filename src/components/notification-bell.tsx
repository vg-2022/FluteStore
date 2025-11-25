"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Notification } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase.auth]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    let data, error;
    const isAdmin = user.user_metadata?.is_admin;

    if (isAdmin) {
      ({ data, error } = await supabase.rpc("get_admin_notifications"));
    } else {
      ({ data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20));
    }

    if (error) {
      console.error("Error fetching notifications:", error);
      toast({
        variant: "destructive",
        title: "Could not fetch notifications",
        description: error.message,
      });
    } else {
      setNotifications(data || []);
      const unread = data?.filter((n) => !n.is_read).length || 0;
      setUnreadCount(unread);
    }
  }, [user, supabase, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = async (notificationId: number) => {
    // Optimistic UI update
    const alreadyRead = notifications.find(
      (n) => n.id === notificationId
    )?.is_read;
    if (!alreadyRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      // Revert UI on error
      if (!alreadyRead) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: false } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not mark notification as read.",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    // Optimistic UI Update
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      // Revert on error
      setNotifications(previousNotifications);
      const unread = previousNotifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not mark all notifications as read.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[40vh]">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="items-start gap-3"
                onSelect={(e) => e.preventDefault()}
              >
                {!n.is_read && (
                  <Circle className="h-2 w-2 mt-1.5 fill-primary text-primary flex-shrink-0" />
                )}
                <div className={n.is_read ? "pl-5 opacity-70" : ""}>
                  <Link
                    href={`/account/orders/${n.order_id}`}
                    className="hover:underline"
                    onClick={() => markAsRead(n.id)}
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </Link>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4">
              You have no new notifications.
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
