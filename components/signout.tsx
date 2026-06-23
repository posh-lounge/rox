"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const LogoutButton = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStep, setLogoutStep] = useState<'idle' | 'processing' | 'clearing' | 'redirecting'>('idle');

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    setLogoutStep('processing');
    
    try {
      console.log("Starting logout process...");
      
      // Step 1: Processing logout request
      setLogoutStep('processing');
      
      // Add a small delay to show the processing step
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Clearing session data
      setLogoutStep('clearing');
      
      // Clear any local storage or cookies if needed
      localStorage.removeItem('user-session-data');
      sessionStorage.clear();
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Step 3: Redirecting
      setLogoutStep('redirecting');
      
      // Sign out with NextAuth
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Show success toast
      toast.success("Logout successful", {
        description: "You have been successfully logged out.",
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Sign out error:", error);
      
      // Reset states on error
      setIsLoggingOut(false);
      setLogoutStep('idle');
      
      toast.error("Failed to log out", {
        description: "An error occurred while trying to log out. Please try again.",
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 5000,
      });
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'clearing':
        return <Shield className="h-5 w-5 text-orange-500" />;
      case 'redirecting':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-gray-500" />;
    }
  };

  const getStepText = (step: string) => {
    switch (step) {
      case 'processing':
        return "Processing logout request...";
      case 'clearing':
        return "Clearing session data...";
      case 'redirecting':
        return "Redirecting to home page...";
      default:
        return "Starting logout...";
    }
  };

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'processing':
        return "Initiating secure logout sequence";
      case 'clearing':
        return "Removing sensitive session information";
      case 'redirecting':
        return "Taking you back to the home page";
      default:
        return "Preparing to log you out";
    }
  };

  return (
    <>
      <button 
        onClick={handleSignOut}
        className="cursor-pointer  duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoggingOut}
      >
        {children}
      </button>

      {/* Logout Progress Modal */}
      {isLoggingOut && (
         <Modal isOpen={true} showCloseButton={false} onClose={() => (false)}  className=" max-w-md" >

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Logo/Icon */}
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Securing Your Session
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're securely logging you out of your account
              </p>
              
              {/* Progress Steps */}
              <div className="space-y-4 mb-6">
                {['processing', 'clearing', 'redirecting'].map((step) => (
                  <div 
                    key={step}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      logoutStep === step 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30' 
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50'
                    } ${logoutStep === step ? 'scale-[1.02]' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          logoutStep === step 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {getStepText(step)}
                        </span>
                        {logoutStep === step && (
                          <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getStepDescription(step)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Logout Progress</span>
                  <span>
                    {logoutStep === 'processing' ? '33%' : 
                     logoutStep === 'clearing' ? '66%' : 
                     logoutStep === 'redirecting' ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: logoutStep === 'processing' ? '33%' : 
                             logoutStep === 'clearing' ? '66%' : 
                             logoutStep === 'redirecting' ? '100%' : '0%'
                    }}
                  />
                </div>
              </div>
              
              {/* Note */}
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  This may take a few moments. Please do not close this window.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default LogoutButton;