import { ArrowLeft, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export function ResetPasswordPage() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10"><div className="w-full max-w-md"><Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link><div className="mt-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div><p className="eyebrow mt-8">New credentials</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your secure reset link will validate this form before a new session is issued.</p><form className="mt-8 space-y-5" onSubmit={(event) => event.preventDefault()}><div className="space-y-2"><Label htmlFor="newPassword">New password</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="newPassword" type="password" placeholder="At least 12 characters" className="pl-10" minLength={12} required /></div></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" placeholder="Repeat your password" minLength={12} required /></div><Button type="submit" className="h-12 w-full">Update password</Button></form></div></div>;
}
