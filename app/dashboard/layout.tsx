"use client";
import React from 'react';
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/components/dashboard/layout/AppHeader";
import AppSidebar from "@/components/dashboard/layout/AppSidebar";
import Backdrop from "@/context/Backdrop";
import Providers from "@/lib/queryProvider";
import {StoreProvider} from "@/lib/redux/storeProvider"

export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
    // Dynamic class for main content margin based on sidebar state
    const mainContentMargin = isMobileOpen
      ? "ml-0"
      : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";
  
    return (
        <>
           <StoreProvider>
           <Providers>
              
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-screen-2xl md:p-6 bg-black"> {children} </div>
        </div>
      </div>
      </Providers>
      </StoreProvider>
      </>
    );
  }
  