import { useState, useEffect, useRef, useCallback } from 'react';

type NotificationOptions = {
  enableSound?: boolean;
  soundPath?: string;
  autoRequestPermission?: boolean;
};

export function useNotifications(options: NotificationOptions = {}) {
  const {
    enableSound = true,
    soundPath = '/sounds/alarm_clock.mp3',
    autoRequestPermission = true
  } = options;

  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimerRef = useRef<number | null>(null);

  // Check if notifications are supported
  const isSupported = typeof Notification !== 'undefined';

  // Request permission for notifications
  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'unsupported';
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return Notification.permission;
    }
  }, [isSupported]);

  // Auto-request permission if specified
  useEffect(() => {
    if (autoRequestPermission && isSupported && permissionState === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, isSupported, permissionState, requestPermission]);

  // Create and show a notification
  const showNotification = useCallback((title: string, options: NotificationOptions & { body: string, tag?: string, onClick?: () => void }) => {
    if (!isSupported || permissionState !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: '/icons/icon-192x192.png',
        tag: options.tag,
        silent: !enableSound // Let browser handle sound if enableSound is false
      });

      if (options.onClick) {
        notification.onclick = () => {
          options.onClick?.();
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permissionState, enableSound]);

  // Play notification sound
  const playSound = useCallback((loop = false) => {
    if (!enableSound) return;
    
    try {
      // If already playing, don't create a new audio instance
      if (isPlaying && audioRef.current) {
        return;
      }

      // Create and configure audio element
      const audio = new Audio(soundPath);
      audio.volume = 1.0;
      audioRef.current = audio;
      
      // For looping sound (important for orders)
      if (loop) {
        // Instead of using the loop property which can be problematic,
        // we'll manually restart the audio when it ends
        audio.addEventListener('ended', function handleEnded() {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
              console.error('Error replaying sound:', err);
            });
          }
        });
      }
      
      // Play the sound
      setIsPlaying(true);
      audio.play().catch(err => {
        console.error('Error playing notification sound:', err);
        setIsPlaying(false);
        
        // Set up click to play for browsers that require user interaction
        const playOnInteraction = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => {
              console.error('Failed to play sound even after interaction:', e);
            });
            setIsPlaying(true);
          }
          document.removeEventListener('click', playOnInteraction);
        };
        
        document.addEventListener('click', playOnInteraction, { once: true });
      });
      
    } catch (error) {
      console.error('Error setting up notification sound:', error);
      setIsPlaying(false);
    }
  }, [enableSound, isPlaying, soundPath]);

  // Stop playing sound
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Remove any event listeners to prevent memory leaks
      audioRef.current.onended = null;
      
      audioRef.current = null;
      setIsPlaying(false);
      
      // Clear any loop timers
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  return {
    isSupported,
    permissionState,
    requestPermission,
    showNotification,
    playSound,
    stopSound,
    isPlaying
  };
}