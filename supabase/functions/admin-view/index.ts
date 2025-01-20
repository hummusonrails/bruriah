import "https://deno.land/x/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { data: chats, error } = await supabaseAdmin
      .from("chats")
      .select(`
        id,
        title,
        created_at,
        profile_id,
        profiles (
          auth_user_id,
          username
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groupedData = chats.reduce((acc, chat) => {
      const userId = chat.profiles?.auth_user_id || "Unknown User";
      const username = chat.profiles?.username || "Unknown Username";
      if (!acc[userId]) {
        acc[userId] = {
          username,
          chats: [],
        };
      }
      acc[userId].chats.push({
        id: chat.id,
        title: chat.title,
        created_at: chat.created_at,
      });
      return acc;
    }, {});

    const responseData = Object.entries(groupedData).map(([userId, data]) => ({
      userId,
      username: data.username,
      chats: data.chats,
    }));

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
