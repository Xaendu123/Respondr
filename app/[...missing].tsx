/**
 * CATCH-ALL ROUTE
 * 
 * Catches any unmatched routes and redirects to not-found screen.
 * However, if we're processing a deep link, we delay the redirect to prevent flashing.
 */

import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function CatchAllRoute() {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Check if this is a deep link that should be handled
    const checkDeepLink = async () => {
      try {
        // Check initial URL (this is what opened the app)
        const initialUrl = await Linking.getInitialURL();
        
        // Check if this looks like a deep link we handle
        if (initialUrl) {
          const url = initialUrl.toLowerCase();
          // If it's a deep link we handle, don't redirect to not-found
          // The deep link handler in _layout.tsx will handle it
          if (
            url.includes('auth/confirm') ||
            url.includes('auth-callback') ||
            url.includes('reset-password') ||
            (url.includes('respondr://') && (url.includes('token') || url.includes('type=')))
          ) {
            // This is a deep link - don't redirect, let the handler process it
            // The handler will navigate away, so we just return null
            // Set a timeout as fallback in case handler fails (shouldn't happen)
            setTimeout(() => {
              setShouldRedirect(true);
            }, 2000);
            return;
          }
        }
        
        // Not a deep link, or no URL - redirect after a short delay
        // This gives the deep link handler time to process if needed
        setTimeout(() => {
          setShouldRedirect(true);
        }, 200);
      } catch (error) {
        // On error, redirect after delay
        setTimeout(() => {
          setShouldRedirect(true);
        }, 200);
      }
    };

    checkDeepLink();
  }, []);

  // Redirect to not-found if not a deep link
  if (shouldRedirect) {
    return <Redirect href={"/not-found" as any} />;
  }

  // If we get here, it's likely a deep link being processed - show nothing to prevent flash
  return null;
}

