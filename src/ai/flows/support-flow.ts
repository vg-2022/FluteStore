"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { createClient } from "@supabase/supabase-js";
import type { User, Order } from "@/lib/types";
import { MessageData } from "genkit";

// IMPORTANT: Never use the admin client in tools exposed to the frontend.
// This client uses the user's session and respects RLS policies.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getCurrentUser = ai.defineTool(
  {
    name: "getCurrentUser",
    description:
      "Get the currently logged-in user. Call this first to determine if the user is authenticated and to get their basic information. This is a prerequisite for most other tools.",
    inputSchema: z.object({}),
    outputSchema: z
      .object({
        id: z.string().optional(),
        email: z.string().optional(),
        fullName: z.string().optional(),
      })
      .nullable(),
  },
  async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.first_name
        ? `${user.user_metadata.first_name} ${
            user.user_metadata.last_name || ""
          }`.trim()
        : user.email,
    };
  }
);

const getUserOrders = ai.defineTool(
  {
    name: "getUserOrders",
    description:
      "Retrieves a list of orders for the currently logged-in user. Use this to answer general questions about past orders.",
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        order_id: z.string(),
        order_date: z.string(),
        order_status: z.string(),
        total: z.number(),
      })
    ),
  },
  async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { data, error } = await supabase
      .from("orders")
      .select("order_id, order_date, order_status, total")
      .eq("user_id", user.id)
      .order("order_date", { ascending: false });
    if (error) throw error;

    return data || [];
  }
);

const getOrderDetails = ai.defineTool(
  {
    name: "getOrderDetails",
    description:
      "Get detailed information about a specific order by its ID. Use this when the user asks about a specific order ID.",
    inputSchema: z.object({
      orderId: z.string().describe("The ID of the order to retrieve."),
    }),
    outputSchema: z
      .object({
        order_id: z.string(),
        order_date: z.string(),
        order_status: z.string(),
        total: z.number(),
        shipping_details: z
          .any()
          .describe("An object containing the shipping address for the order."),
        cart_items: z
          .array(
            z.object({
              productId: z.string(),
              quantity: z.number(),
            })
          )
          .describe("An array of items in the order."),
      })
      .nullable(),
  },
  async ({ orderId }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // The chatbot might get the ID with a hash, so let's remove it.
    const cleanedOrderId = orderId.replace("#", "");

    const { data, error } = await supabase
      .from("orders")
      .select(
        "order_id, order_date, order_status, total, shipping_details, cart_items"
      )
      .eq("user_id", user.id)
      .eq("order_id", cleanedOrderId)
      .single();
    if (error) {
      console.error("Error fetching order details:", error);
      return null;
    }
    return data;
  }
);

const getShopSupportInfo = ai.defineTool(
  {
    name: "getShopSupportInfo",
    description:
      "Provides general support information, such as contact details and FAQ page links.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      contactEmail: z.string(),
      contactPhone: z.string(),
      faqUrl: z.string(),
    }),
  },
  async () => {
    // In a real app, this would fetch from a CMS or settings table.
    return {
      contactEmail: "support@flutestore.com",
      contactPhone: "+91 98765 43210",
      faqUrl: "/faq",
    };
  }
);

export const supportFlow = ai.defineFlow(
  {
    name: "supportFlow",
    inputSchema: z.array(z.any()),
    outputSchema: z.string(),
    system: `You are a helpful and friendly customer support assistant for an online musical instrument store called FluteStore.
    - If the user is not logged in, politely ask them to log in to access their personal information like orders or profile.
    - Use the available tools to answer user questions about their orders, profile, or shipping addresses. Do not make up information or mention other companies like Amazon or Walmart.
    - When a user provides an order ID like '#12345', use the getOrderDetails tool to fetch its details.
    - If you don't know the answer or a tool fails, be honest and suggest they contact support directly. Provide the support info using the getShopSupportInfo tool.
    - Keep your responses concise and clear.
    - When asked about orders, list the most recent ones first.`,
    tools: [getCurrentUser, getUserOrders, getOrderDetails, getShopSupportInfo],
  },
  async (messages) => {
    const generateResponse = await ai.generate({
      history: messages,
      prompt: messages[messages.length - 1].content,
      model: "googleai/gemini-2.5-flash",
    });

    const text = generateResponse.text;

    if (text) {
      return text;
    } else {
      return "I'm sorry, I encountered an issue and can't provide a response right now.";
    }
  }
);

export async function run(messages: MessageData[]): Promise<string> {
  return await supportFlow(messages);
}
