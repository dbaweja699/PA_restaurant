import { Express, Request, Response } from "express";
import fetch from "node-fetch";
import { storage } from "./storage";

// System prompt to set context for the AI
const SYSTEM_PROMPT = `You are an AI assistant for a restaurant management platform called Dblytics Restaurant AI Assistant.

Your role is to help restaurant owners and staff use the platform effectively. You can:
1. Explain features of the platform (calls, chats, reviews, bookings, orders, social media management)
2. Provide information about how the AI automation works for restaurant customer interactions
3. Offer tips on restaurant management and customer service
4. Help with troubleshooting platform issues

Be concise, friendly, and professional. If you don't know the answer, admit it and suggest where they might find the information.
Keep responses under 150 words unless a detailed explanation is specifically requested.`;

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.yourdomain.com/webhook/ai-restaurant";

// Setup route handler
export function setupOpenAIRoutes(app: Express) {
  // Chat completion endpoint
  app.post("/api/chatbot", async (req: Request, res: Response) => {
    try {
      const { message, chatHistory, customerName, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Format chat history for n8n (keeping original formatting)
      const formattedHistory = chatHistory?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) || [];

      // Create webhook request payload (using edited code's payload structure)
      const payload = {
        message,
        sessionId: sessionId || `user-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "Website",
        customerName: customerName || "Guest",
        status: "active"
      };

      // Send request to n8n webhook (using edited code's simpler fetch call)
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        //Handle errors similar to the original code, but with simpler structure from edited code
        console.error(`n8n webhook returned ${response.status}`);
        return res.status(502).json({
          content: `Unable to connect to the n8n workflow. Status: ${response.status}`,
          model: "error_connection"
        });
      }

      const data = await response.json();

      // Create chat record in database (using edited code's database interaction)
      await storage.createChat({
        customerName: payload.customerName,
        status: "active",
        startTime: new Date(),
        topic: "General Inquiry",
        source: "website",
        summary: message.substring(0, 100),
        aiHandled: true
      });

      return res.json({
        content: data.content || data.message,
        model: "n8n",
        sessionId: payload.sessionId
      });

    } catch (error: any) {
      console.error("Chatbot API error:", error);
      return res.status(500).json({ 
        content: "An error occurred while processing your request. Please try again later.",
        model: "error_internal"
      });
    }
  });
}