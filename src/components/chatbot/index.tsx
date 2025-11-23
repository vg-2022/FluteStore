"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  MessageSquare,
  X,
  Bot,
  User as UserIcon,
  CornerDownLeft,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { MessageData } from "genkit";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";
import Image from "next/image";

const initialMessages: MessageData[] = [
  {
    role: "model",
    content: [
      {
        text: "Hello! I'm your friendly FluteStore assistant. How can I help you today?",
      },
    ],
  },
];

const quickActions = [
  { label: "My Orders", prompt: "Show me my recent orders", icon: ShoppingBag },
  {
    label: "Track an Order",
    prompt: "Can you track an order for me?",
    icon: Truck,
  },
  { label: "Account", prompt: "I need help with my account", icon: UserRound },
];

interface ChatbotProps {
  user: SupabaseUser | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialMessage?: string;
  setInitialMessage: (message: string | undefined) => void;
}

export function Chatbot({
  user,
  isOpen,
  setIsOpen,
  initialMessage,
  setInitialMessage,
}: ChatbotProps) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { storeDetails } = useSettings();
  const isFirstRender = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async (messageToSend?: string) => {
    const textToSend = messageToSend || input;
    if (!textToSend.trim()) return;

    const userMessage: MessageData = {
      role: "user",
      content: [{ text: textToSend }],
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();

      if (response.ok) {
        const modelMessage: MessageData = {
          role: "model",
          content: [{ text: data.response }],
        };
        setMessages((prev) => [...prev, modelMessage]);
      } else {
        throw new Error(data.error || "API request failed");
      }
    } catch (error: any) {
      const errorMessage: MessageData = {
        role: "model",
        content: [
          { text: `I'm sorry, something went wrong: ${error.message}` },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialMessage && isOpen) {
      if (isFirstRender.current) {
        // On first open, just set the input
        setInput(initialMessage);
        isFirstRender.current = false;
      } else {
        // On subsequent opens with an initial message, send it directly
        handleSend(initialMessage);
      }
      // Clear the initial message after using it
      setInitialMessage(undefined);
    }
  }, [initialMessage, isOpen]);

  if (!user) return null; // Only show chatbot for logged-in users.

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              className="rounded-full shadow-lg h-14 w-14"
              onClick={() => setIsOpen(true)}
              size="icon"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="border-2 border-primary/50">
                    {storeDetails.logo ? (
                      <AvatarImage
                        src={storeDetails.logo}
                        alt={storeDetails.name}
                        className="object-contain"
                      />
                    ) : (
                      <AvatarFallback>
                        <Bot />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {storeDetails.name} Support
                    </CardTitle>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-2 text-sm",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "model" && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          <Bot size={14} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "px-3 py-2 max-w-[85%] whitespace-pre-wrap",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-muted rounded-2xl rounded-bl-md"
                      )}
                    >
                      {(message.content[0] as any).text}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          <UserIcon size={14} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-end gap-2 justify-start text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        <Bot size={14} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl rounded-bl-md px-3 py-2 bg-muted">
                      <div className="flex gap-1 items-center">
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0s]" />
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.15s]" />
                        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <CardFooter className="p-2 border-t flex-col items-start gap-2">
                <div className="flex gap-2 px-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => handleSend(action.prompt)}
                    >
                      <action.icon className="mr-1.5 h-3 w-3" />
                      {action.label}
                    </Button>
                  ))}
                </div>
                <div className="flex w-full items-center relative">
                  <Input
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                    className="rounded-full pr-12"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSend()}
                    disabled={isLoading}
                    className="absolute right-1 w-8 h-8 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
