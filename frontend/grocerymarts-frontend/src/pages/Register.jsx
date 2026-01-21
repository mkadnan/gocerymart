import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Loader2, MailCheck, Package } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    referral_code: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const { register, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }
    setOtpLoading(true);
    setError('');
    const result = await sendOtp({ email: formData.email });
    if (result.success) {
      setOtpSent(true);
    } else {
      setError(result.message || 'Failed to send OTP');
    }
    setOtpLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setRegisterLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setRegisterLoading(false);
      return;
    }

    if (!formData.otp) {
      setError('Please enter the OTP sent to your email');
      setRegisterLoading(false);
      return;
    }

    // Verify OTP first
    const otpResult = await verifyOtp({ email: formData.email, otp: formData.otp });
    if (!otpResult.success) {
      setError(otpResult.message || 'Invalid OTP');
      setRegisterLoading(false);
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      contact: formData.contact,
      referral_code: formData.referral_code || undefined
    };

    const result = await register(userData);

    if (result.success) {
      navigate('/dashboard'); // success → redirect to dashboard
    } else {
      setError(result.message || 'Registration failed');
    }

    setRegisterLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join GroceryMarts</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in here
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Get started with fresh groceries delivered to your door</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Enter your full name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Enter your email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input id="contact" name="contact" type="tel" required value={formData.contact} onChange={handleChange} placeholder="Enter your contact number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Create a password (min 6 characters)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral_code" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Referral Code (Optional)
                </Label>
                <Input id="referral_code" name="referral_code" type="text" value={formData.referral_code} onChange={handleChange} placeholder="Enter referral code to earn bonus credits" />
              </div>

              <Button type="button" className="w-full" onClick={handleSendOtp} disabled={otpLoading || !formData.email || otpSent} variant="outline">
                <MailCheck className="mr-2 h-4 w-4" />
                {otpLoading ? 'Sending OTP...' : otpSent ? 'OTP Sent' : 'Send OTP'}
              </Button>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input id="otp" name="otp" type="text" required value={formData.otp} onChange={handleChange} placeholder="Enter the OTP sent to your email" />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
