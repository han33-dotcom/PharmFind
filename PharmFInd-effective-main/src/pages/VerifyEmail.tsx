import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/services/api/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";

interface VerifyEmailResponse {
  message?: string;
  success?: boolean;
}

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email with backend
    const verifyEmail = async () => {
      try {
        const response = await apiClient.get<VerifyEmailResponse>(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        const errorMessage = error?.error?.message || error?.message || 'Failed to verify email';
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="small" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Your email has been verified!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-green-600 font-medium">{message}</p>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting you to the dashboard...
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-red-600 font-medium">{message}</p>
              <div className="space-y-2 w-full">
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  Back to Login
                </Button>
                <Link to="/dashboard" className="block w-full">
                  <Button variant="outline" className="w-full">
                    Continue Anyway
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;

