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
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Agent ID from environment variables
const AGENT_ID = "DEcQdAmwL4h59znAA3kT";

export function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  // Clean up when dialog is closed
  const handleClose = () => {
    if (status === "connected") {
      handleEndConversation();
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-white hover:bg-white/10 bg-gradient-to-r from-[#2A4833] to-[#1e6434]"
        title="Call AI Voice Agent"
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="bg-gradient-to-r from-[#2A4833] to-[#1e6434] text-transparent bg-clip-text font-semibold">
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
                  className="w-full bg-gradient-to-r from-[#2A4833] to-[#1e6434] hover:from-[#234029] hover:to-[#19542c]"
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
