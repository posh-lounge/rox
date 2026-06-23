import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";


import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Rox House LTD - Smart Solutions ",
  description: "Rox House LTD - Smart Solutions for Your Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head /> {/* Needed to let Next.js handle metadata injection */}
       
      <body>
        <Toaster richColors position="top-center" />
        <NextTopLoader 
            color="#ea580c"
            initialPosition={0.08}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            shadow="0 0 10px #ea580c,0 0 5px #ea580c"
          />
         <ThemeProvider>
          <SidebarProvider>
           
              {children}
             
             
              </SidebarProvider>
        </ThemeProvider>
      </body>
     
      
    </html>
  );
}
