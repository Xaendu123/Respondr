import { Redirect } from "expo-router";
import { useAuth } from "../src/providers/AuthProvider";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state or redirect based on auth status
  if (isLoading) {
    // Return null or a loading screen while checking auth
    return null;
  }
  
  // Redirect to login if not authenticated, otherwise to main app
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/(tabs)/log" />;
}
