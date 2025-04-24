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

const N8N_WEBHOOK_URL =
  "http://ec2-13-232-234-201.ap-south-1.compute.amazonaws.com:5678/webhook/dbb7d22a-8145-4d12-9153-d3479fdbb54d";

// Keep track of active sessions
const activeSessions = new Map<string, {
  userId?: number;
  customerName: string;
  status: string;
  lastActive: Date;
}>();

// Setup route handler
export function setupOpenAIRoutes(app: Express) {
  // Chat completion endpoint
  app.post("/api/chatbot", async (req: Request, res: Response) => {
    try {
      const { message, chatHistory, customerName, sessionId: requestSessionId, userId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Create or retrieve session ID
      const sessionId = requestSessionId || `user-${userId || 'guest'}-${Date.now()}`;
      
      // Get user info if available
      let userInfo = null;
      if (userId) {
        try {
          userInfo = await storage.getUser(userId);
        } catch (error) {
          console.warn("Could not retrieve user information:", error);
        }
      }
      
      // Update or create session information
      activeSessions.set(sessionId, {
        userId: userId,
        customerName: customerName || (userInfo?.full_name || "Guest"),
        status: "active",
        lastActive: new Date()
      });
      
      // Log active sessions occasionally (for debugging)
      if (Math.random() < 0.1) {
        console.log(`Active sessions: ${activeSessions.size}`);
      }

      // Create webhook request payload with exact format needed for n8n
      const payload = {
        message,
        sessionId,
        timestamp: new Date().toISOString(),
        source: "Website",
        customerName: customerName || (userInfo?.full_name || "Guest"),
        status: activeSessions.get(sessionId)?.status || "active"
      };

      console.log("Sending to n8n webhook:", JSON.stringify(payload));

      // Send request to n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        //Handle errors similar to the original code, but with simpler structure from edited code
        console.error(`n8n webhook returned ${response.status}`);
        return res.status(502).json({
          content: `Unable to connect to the n8n workflow. Status: ${response.status}`,
          model: "error_connection",
        });
      }

      const data = await response.json() as { content?: string; message?: string; output?: string };

      // Validate response from n8n
      const responseContent = data.content || data.message || data.output;
      if (!responseContent) {
        console.error('Invalid response from n8n webhook:', data);
        return res.status(502).json({
          content: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
          model: "error_response",
          sessionId: payload.sessionId
        });
      }

      // Try to create chat record in database, but don't fail if it doesn't work
      try {
        await storage.createChat({
          customerName: payload.customerName,
          status: "active",
          startTime: new Date(),
          topic: "General Inquiry",
          source: "website",
          summary: message.substring(0, 100),
          aiHandled: true,
        });
        console.log("Chat record created successfully");
      } catch (error) {
        console.warn("Could not create chat record in database:", error);
        // Continue without failing the request
      }

      return res.json({
        content: responseContent,
        model: "n8n",
        sessionId: payload.sessionId,
      });
    } catch (error: any) {
      console.error("Chatbot API error:", error);
      return res.status(500).json({
        content:
          "An error occurred while processing your request. Please try again later.",
        model: "error_internal",
      });
    }
  });
}
