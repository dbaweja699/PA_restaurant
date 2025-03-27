import { Express, Request, Response } from "express";
import fetch from "node-fetch";

// System prompt to set context for the AI (used in fallback responses)
const SYSTEM_PROMPT = `You are an AI assistant for a restaurant management platform called Dblytics Restaurant AI Assistant.

Your role is to help restaurant owners and staff use the platform effectively. You can:
1. Explain features of the platform (calls, chats, reviews, bookings, orders, social media management)
2. Provide information about how the AI automation works for restaurant customer interactions
3. Offer tips on restaurant management and customer service
4. Help with troubleshooting platform issues

Be concise, friendly, and professional. If you don't know the answer, admit it and suggest where they might find the information.
Keep responses under 150 words unless a detailed explanation is specifically requested.`;

// n8n webhook URL - to be set by environment variable
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

// Setup route handler
export function setupOpenAIRoutes(app: Express) {
  // Chat completion endpoint
  app.post("/api/chatbot", async (req: Request, res: Response) => {
    try {
      const { message, chatHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Format chat history for n8n
      const formattedHistory = chatHistory?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) || [];

      // Add system message at the beginning
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...formattedHistory,
        { role: "user", content: message },
      ];

      // Check if n8n webhook URL is available
      if (!N8N_WEBHOOK_URL) {
        console.log("n8n webhook URL not found, using fallback responses");
        return res.status(200).json({ 
          content: getFallbackResponse(message),
          model: "fallback"
        });
      }

      // Call n8n webhook
      try {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            userQuery: message
          }),
        });

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook returned status ${n8nResponse.status}`);
        }

        const data = await n8nResponse.json();
        
        // Send response
        res.status(200).json({
          content: data.response || data.content || "Sorry, I couldn't process your request at this time.",
          model: data.model || "n8n"
        });
      } catch (error) {
        console.error("n8n webhook error:", error);
        // Fall back to predefined responses if n8n fails
        return res.status(200).json({ 
          content: getFallbackResponse(message),
          model: "fallback_n8n_error"
        });
      }
    } catch (error: any) {
      console.error("Chatbot API error:", error);
      
      // Return fallback response on error
      res.status(200).json({ 
        content: "I apologize, but I'm having trouble connecting to my knowledge base at the moment. Please try again later, or contact support if this issue persists.",
        model: "error_fallback"
      });
    }
  });
}

// Fallback responses when n8n webhook is not available
function getFallbackResponse(message: string): string {
  const lowerCaseMessage = message.toLowerCase();
  
  // Simple keyword matching for fallback responses
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! I'm your Dblytics Restaurant AI Assistant. How can I help you manage your restaurant operations today?";
  }
  
  if (lowerCaseMessage.includes("help")) {
    return "I can help you with various tasks like explaining features, managing bookings, answering questions about calls, chats, reviews, and more. What would you like to know?";
  }
  
  if (lowerCaseMessage.includes("feature")) {
    return "Dblytics Restaurant AI Assistant includes several features: AI-powered call answering, automated chat responses, review management, booking system, and analytics dashboard. Would you like to learn more about any specific feature?";
  }
  
  if (lowerCaseMessage.includes("booking")) {
    return "You can manage all your restaurant bookings in the Bookings section. The AI system can automatically handle new booking requests coming in through calls or chats.";
  }
  
  if (lowerCaseMessage.includes("call")) {
    return "Our AI-powered call system answers customer calls automatically. It can take reservations, answer questions about your restaurant, and collect customer information. You can view all call recordings and transcripts in the Calls section.";
  }
  
  if (lowerCaseMessage.includes("review")) {
    return "The AI review response system automatically responds to customer reviews across multiple platforms. You can view and manage all reviews in the Reviews section.";
  }
  
  if (lowerCaseMessage.includes("dashboard")) {
    return "The dashboard gives you an overview of your restaurant's performance. It shows metrics like call volume, active chats, upcoming bookings, and reviews. The charts help you track trends over time.";
  }
  
  if (lowerCaseMessage.includes("notification")) {
    return "Notifications keep you updated about important events like new bookings, calls, or reviews. You can access them by clicking the bell icon in the top navigation bar.";
  }
  
  if (lowerCaseMessage.includes("n8n")) {
    return "n8n is a powerful workflow automation platform that powers many of the automation features in Dblytics Restaurant AI Assistant. It helps connect different services and automate tasks for your restaurant.";
  }

  // Default fallback response
  return "I'm your restaurant management assistant. I can help you understand how to use the Dblytics platform, manage bookings, calls, and reviews. What specific information are you looking for?";
}