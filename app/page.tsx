
import SignInForm from '@/components/auth/signIn';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Personal Assistant - Login ",
  description: "Personal Assistant System",
};

export default function Widget() {
 
  return (
    <div className="">
     <SignInForm />
    </div>
  );
}
