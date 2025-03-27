import { Express, Request, Response } from "express";
import fetch from "node-fetch";

// System prompt to set context for the AI
const SYSTEM_PROMPT = `You are an AI assistant for a restaurant management platform called Dblytics Restaurant AI Assistant.

Your role is to help restaurant owners and staff use the platform effectively. You can:
1. Explain features of the platform (calls, chats, reviews, bookings, orders, social media management)
2. Provide information about how the AI automation works for restaurant customer interactions
3. Offer tips on restaurant management and customer service
4. Help with troubleshooting platform issues

Be concise, friendly, and professional. If you don't know the answer, admit it and suggest where they might find the information.
Keep responses under 150 words unless a detailed explanation is specifically requested.`;

// n8n webhook URL - to be set by environment variable
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://ec2-13-58-27-158.us-east-2.compute.amazonaws.com:5678/webhook-test/a8da29a8-c2cd-42ad-8b74-126ce7252b1d";

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
        console.log("n8n webhook URL not found");
        return res.status(503).json({ 
          content: "The AI service is currently unavailable. Please check your n8n workflow configuration and ensure the webhook URL is provided.",
          model: "error_config"
        });
      }

      // Call n8n webhook
      try {
        console.log("Calling n8n webhook URL:", N8N_WEBHOOK_URL);
        console.log("Sending message payload:", JSON.stringify({
          messages: messages,
          userQuery: message,
          timestamp: new Date().toISOString()
        }).substring(0, 200) + "...");
        
        const fetchTimeout = 10000; // 10 seconds timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, fetchTimeout);
        
        try {
          const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              messages: messages,
              userQuery: message,
              timestamp: new Date().toISOString()
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          console.log("n8n webhook response status:", n8nResponse.status);
          
          // Get response as text first for debugging
          const responseText = await n8nResponse.text();
          console.log("n8n webhook raw response:", responseText);
          
          if (!n8nResponse.ok) {
            console.error(`n8n webhook error response (${n8nResponse.status}):`, responseText || 'No response body');
            
            // Return specific error message based on HTTP status
            if (n8nResponse.status === 404) {
              return res.status(503).json({
                content: "The n8n webhook needs to be triggered. Please:\n1. Go to your n8n workflow\n2. Click the 'Test workflow' button in the canvas\n3. Try your request again\n\nNote: In test mode, the webhook only stays active for one request after clicking test.",
                model: "error_webhook_inactive"
              });
            }
            
            throw new Error(`n8n webhook returned status ${n8nResponse.status}`);
          }

          // Parse the response JSON if possible
          let data = {};
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Failed to parse n8n response as JSON:", parseError);
            // If not JSON, use the raw text as the response
            return res.status(200).json({
              content: responseText,
              model: "n8n_raw"
            });
          }
          
          // Send the parsed JSON response
          return res.status(200).json({
            content: data.response || data.content || "The n8n workflow responded but did not provide a content field.",
            model: data.model || "n8n"
          });
        } catch (fetchError: any) {
          clearTimeout(timeout);
          
          if (fetchError.name === 'AbortError') {
            console.error("n8n webhook request timed out after", fetchTimeout, "ms");
            return res.status(504).json({
              content: `The request to the n8n workflow timed out after ${fetchTimeout}ms. Please try again later or check if the n8n server is running.`,
              model: "error_timeout"
            });
          } else {
            throw fetchError;
          }
        }
      } catch (error: any) {
        console.error("n8n webhook error:", error.message);
        // Log detailed error information for debugging
        if (error.cause) {
          console.error("Error cause:", error.cause);
        }
        
        // Return error message
        return res.status(502).json({ 
          content: `Unable to connect to the n8n workflow: ${error.message}. Please ensure the n8n server is running and the workflow is properly configured.`,
          model: "error_connection"
        });
      }
    } catch (error: any) {
      console.error("Chatbot API error:", error);
      
      // Return error message
      res.status(500).json({ 
        content: "An internal server error occurred while processing your request. Please try again later.",
        model: "error_internal"
      });
    }
  });
}