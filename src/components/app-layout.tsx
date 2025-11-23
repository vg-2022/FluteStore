"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BottomNav } from "./bottom-nav";
import React, { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Chatbot } from "./chatbot";

interface AppLayoutContextType {
  openChatbot: (initialMessage?: string) => void;
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(
  undefined
);

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error("useAppLayout must be used within AppLayout");
  }
  return context;
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const isAdminRoute = pathname.startsWith("/admin");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle the user state update
  };

  const openChatbot = (initialMessage?: string) => {
    if (initialMessage) {
      setInitialChatMessage(initialMessage);
    } else {
      setInitialChatMessage(undefined);
    }
    setIsChatOpen(true);
  };

  if (isAdminRoute) {
    return <main>{children}</main>;
  }

  return (
    <AppLayoutContext.Provider value={{ openChatbot }}>
      <div className="relative flex min-h-dvh flex-col bg-background">
        <Header user={user} loading={loading} onSignOut={handleSignOut} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        {!loading && (
          <Chatbot
            user={user}
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            initialMessage={initialChatMessage}
            setInitialMessage={setInitialChatMessage}
          />
        )}
      </div>
    </AppLayoutContext.Provider>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
