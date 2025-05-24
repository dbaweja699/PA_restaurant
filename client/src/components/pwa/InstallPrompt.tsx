import { useState } from 'react';
import { usePwa } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Download, Bell } from 'lucide-react';

export function InstallPrompt() {
  const { canInstall, promptInstall } = usePwa();
  const [showPrompt, setShowPrompt] = useState(true);
  
  // If we can't install or the user dismissed, don't show
  if (!canInstall || !showPrompt) return null;
  
  // Handle the install action
  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      // User dismissed the prompt, hide it
      setShowPrompt(false);
    }
  };
  
  // Handle dismissing the prompt
  const handleDismiss = () => {
    setShowPrompt(false);
  };
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <div className="bg-primary rounded-full p-2 mr-4">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Install our app</h3>
            <p className="text-sm text-gray-600">
              Get sound notifications and faster access
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <Bell className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-xs text-gray-600">
            Installing allows sound notifications when orders arrive!
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Not now
        </Button>
        <Button onClick={handleInstall}>
          Install
        </Button>
      </CardFooter>
    </Card>
  );
}