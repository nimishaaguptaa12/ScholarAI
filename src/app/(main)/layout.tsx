"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { LayoutGrid, BookOpen, Bot, Plus, LogOut, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function MainSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        router.push("/login");
    };

    const navItems = [
        { href: "/dashboard", icon: <LayoutGrid />, label: "Dashboard" },
        { href: "/decks", icon: <BookOpen />, label: "My Decks" },
        { href: "/create", icon: <Plus />, label: "Create" },
        { href: "/tutor", icon: <Bot />, label: "AI Tutor" },
    ];

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <AppLogo className="size-8 text-primary" />
                    <span className="text-lg font-semibold tracking-tight">FlashGenius</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
                         <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                               <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                   <span>
                                       {item.icon}
                                       <span>{item.label}</span>
                                   </span>
                               </SidebarMenuButton>
                            </Link>
                         </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">User Profile</span>
                         </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const user = localStorage.getItem("currentUser");
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.push("/login");
      }
    } catch (error) {
        router.push("/login");
    } finally {
        setIsLoading(false);
    }
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <MainSidebar />
        <SidebarInset>
            <header className="flex h-16 items-center justify-between border-b bg-background/50 backdrop-blur-sm px-4 md:px-6">
                 <SidebarTrigger className="md:hidden" />
                 <div className="flex-1"></div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
