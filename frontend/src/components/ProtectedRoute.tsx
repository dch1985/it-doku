import { ReactNode } from 'react';
import { useAuthWrapper } from '@/hooks/useAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = useAuthWrapper();
  const { isAuthenticated, login, user } = auth;
  const isLoading = auth.loading || auth.isLoading || false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please log in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full">
              Log In with Microsoft
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role if required
  if (requiredRole === 'admin' && user) {
    // Role check would be done via backend API
    // For now, we'll allow access and let backend handle authorization
  }

  return <>{children}</>;
}

