import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST and OPTIONS methods
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
  
    try {
      console.log("Request received. Method:", req.method);
  
      const body = await req.json();
      console.log("Parsed request body:", JSON.stringify(body, null, 2));
  
      const { prompt, context = [], profileData = {} } = body; 
  
      if (!prompt) {
        console.error("Error: Prompt input is missing.");
        return new Response(
          JSON.stringify({ error: "Prompt input is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
  
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        console.error("Error: OPENAI_API_KEY environment variable is missing.");
        return new Response(
          JSON.stringify({ error: "OpenAI API key is not configured." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
  
      console.log("OpenAI API key detected. Input prompt:", prompt);
  
      const openai = new OpenAI({ apiKey });
  
      const profileContextMessage = {
        role: "system",
        content: `Here is the user's profile context for better understanding:
          - School: ${profileData.school || "School not set"}
          - City: ${profileData.city || "City not set"}
          - Grade: ${profileData.grade || "Grade level not set"}`,
      };
  
      const systemPrompt = `You are Bruriah, a highly intelligent and kind tutor for children. Your purpose is to assist kids in learning their school subjects in a patient, supportive, and engaging manner. Always provide thorough explanations and examples, and encourage curiosity and critical thinking. Adapt your responses to the child’s age and comprehension level, using language and tone that is appropriate for kids. Be encouraging and positive, ensuring that learning remains fun and rewarding.`;
  
      const messages = [
        { role: "system", content: systemPrompt },
        profileContextMessage,
        ...(Array.isArray(context)
          ? context
              .filter((msg) => msg && typeof msg.role === "string" && typeof msg.content === "string")
              .map((msg) => ({ role: msg.role, content: msg.content }))
          : []), 
        { role: "user", content: prompt },
      ];
  
      const encoder = new TextEncoder();
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            console.log("Initiating OpenAI streaming response...");
  
            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              stream: true,
              messages,
            });
  
            for await (const chunk of response) {
              controller.enqueue(encoder.encode(chunk.choices[0].delta.content));
            }
  
            controller.close();
          } catch (error) {
            console.error("Error streaming response from OpenAI:", error);
            controller.error(error);
          }
        },
      });
  
      return new Response(responseStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        status: 200,
      });
    } catch (error) {
      console.error("Error handling request:", error.message);
      console.error("Stack trace:", error.stack);
  
      return new Response(
        JSON.stringify({ error: `Failed to handle request: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  });
  