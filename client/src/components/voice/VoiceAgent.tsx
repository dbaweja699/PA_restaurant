"use client";

import React, { useEffect, useState } from "react";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Agent ID for Fasta Pasta restaurant
const AGENT_ID = "3Udx7nfy3Wpgv9JXpPu7";

export function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast({
        title: "Connected to AI Voice Agent",
        description: "You can now speak with the agent",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      toast({
        title: "Disconnected from AI Voice Agent",
        variant: "default",
      });
    },
    onMessage: (message) => {
      console.log("Received message:", message);
    },
    onError: (error: string | Error) => {
      const errorMsg = typeof error === "string" ? error : error.message;
      setErrorMessage(errorMsg);
      console.error("Voice agent error:", error);
      toast({
        title: "Voice Agent Error",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    // Request microphone permission when dialog is opened
    if (open) {
      requestMicPermission();
    }
  }, [open]);

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        "Microphone access denied. Please enable microphone permissions.",
      );
      console.error("Error accessing microphone:", error);
    }
  };

  const handleStartConversation = async () => {
    try {
      setErrorMessage("");
      await conversation.startSession({
        agentId: AGENT_ID,
      });
    } catch (error) {
      setErrorMessage("Failed to start conversation with AI agent");
      console.error("Error starting conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (error) {
      setErrorMessage("Failed to change volume");
      console.error("Error changing volume:", error);
    }
  };

  // Function to send text to AI voice agent using our new proxy
  const handleSendText = async () => {
    if (!textInput.trim()) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      const response = await fetch('/api/proxy/ai_voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: AGENT_ID,
          text: textInput
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("AI voice proxy response:", data);
      
      toast({
        title: "Message sent to AI Voice Agent",
        description: "The message was sent successfully",
      });
      
      // Clear the input field after successful submission
      setTextInput("");
    } catch (error) {
      setErrorMessage(`Failed to send text to AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Error sending text to AI agent:", error);
      toast({
        title: "Error",
        description: "Failed to send text to AI agent",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Toggle between voice and text modes
  const toggleInputMode = () => {
    setIsTextMode(!isTextMode);
  };

  // Clean up when dialog is closed
  const handleClose = () => {
    if (status === "connected") {
      handleEndConversation();
    }
    setTextInput("");
    setIsTextMode(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-white hover:bg-white/10 bg-gradient-to-r from-indigo-500 to-purple-600"
        title="Call AI Voice Agent"
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text font-semibold">
                AI Voice Agent
              </span>
              <div className="flex gap-2 items-center">
                {status === "connected" && (
                  <Badge
                    variant="outline"
                    className={`${isSpeaking ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"} border-none`}
                  >
                    {isSpeaking ? "Speaking..." : "Listening..."}
                  </Badge>
                )}
                {status === "connected" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {status === "connected" ? (
              <div className="space-y-4">
                <p className="text-sm text-center">
                  You're connected to the restaurant AI assistant. Speak clearly
                  and the agent will respond to your questions.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleEndConversation}
                  className="w-full"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-center">
                  Start a voice conversation with our AI restaurant assistant
                  for help with bookings, menu information, and more.
                </p>
                <Button
                  onClick={handleStartConversation}
                  disabled={!hasPermission}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Call
                </Button>
                {!hasPermission && (
                  <p className="text-yellow-600 text-xs text-center">
                    Please allow microphone access to use voice chat
                  </p>
                )}
              </div>
            )}

            {errorMessage && (
              <p className="text-red-500 text-xs text-center">{errorMessage}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
