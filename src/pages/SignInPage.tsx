
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    
    try {
      // Here you would typically call your auth service
      console.log('Sign in values:', values);
      
      // Simulate auth delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-gray-50 dark:bg-tattoo-black">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-300">Sign in to your Tattoo Buddy account</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@example.com" 
                          type="email" 
                          {...field} 
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link to="#" className="text-tattoo-purple hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-tattoo-purple hover:bg-tattoo-purple/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-tattoo-purple hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignInPage;
