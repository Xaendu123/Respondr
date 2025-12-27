/**
 * CATCH-ALL ROUTE
 * 
 * Catches any unmatched routes and redirects to not-found screen.
 */

import { Redirect } from 'expo-router';

export default function CatchAllRoute() {
  return <Redirect href={"/not-found" as any} />;
}

