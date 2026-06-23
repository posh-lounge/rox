
import SignInForm from '@/components/auth/signIn';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Rox House LTD - Login ",
  description: "Rox House LTD System",
};

export default function Widget() {
 
  return (
    <div className="">
     <SignInForm />
    </div>
  );
}
