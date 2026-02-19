'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Film, 
  BookOpen, 
  Gift, 
  MapPin, 
  Star, 
  TrendingUp,
  Menu,
  X,
  Home,
  Search,
  Sparkles
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: '首頁',
    href: '/',
    icon: <Home className="w-4 h-4" />,
    description: '電影特典速報'
  },
  {
    title: '電影專欄',
    href: '/blog',
    icon: <BookOpen className="w-4 h-4" />,
    description: '最新文章與影評'
  },
  {
    title: '特典情報',
    href: '/bonuses',
    icon: <Gift className="w-4 h-4" />,
    description: '限定禮品資訊'
  },
  {
    title: '影評專欄',
    href: '/reviews',
    icon: <Star className="w-4 h-4" />,
    description: '專業影評分析'
  },
  {
    title: '戲院資訊',
    href: '/theaters',
    icon: <MapPin className="w-4 h-4" />,
    description: '影城最新消息'
  },
  {
    title: '票房分析',
    href: '/boxoffice',
    icon: <TrendingUp className="w-4 h-4" />,
    description: '票房數據追蹤'
  }
];

export function SmartNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use scroll direction hook with custom settings
  const { isVisible, isAtTop } = useScrollDirection({
    threshold: 5,
    scrollUpThreshold: 20,
    offset: 10
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          "bg-background/95 backdrop-blur-md border-b",
          // Transform and opacity based on scroll
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          // Add subtle shadow when scrolled
          !isAtTop && "shadow-lg"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link 
              href="/" 
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <Sparkles className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <span 
                className={cn(
                  "font-headline text-xl font-bold text-primary hidden sm:inline-block transition-all duration-500 ease-out",
                  isAtTop ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
                )}
              >
                特典速報
              </span>
              <span 
                className={cn(
                  "font-headline text-lg font-bold text-primary sm:hidden transition-all duration-500 ease-out",
                  isAtTop ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
                )}
              >
                特典速報
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive(item.href) 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                asChild
              >
                <Link href="/search" aria-label="搜尋">
                  <Search className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  aria-label="開啟選單"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-headline">特典速報</span>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation Links */}
                <div className="mt-8 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 rounded-lg transition-colors",
                        "hover:bg-accent",
                        isActive(item.href) 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground"
                      )}
                    >
                      <span className={cn(
                        "mt-0.5",
                        isActive(item.href) ? "text-primary" : "text-muted-foreground"
                      )}>
                        {item.icon}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile Search & Notification */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-2 px-3">
                    <NotificationBell />
                    <span className="text-sm text-muted-foreground">新特典通知</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/search">
                      <Search className="w-4 h-4 mr-2" />
                      搜尋電影
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content jump */}
      <div className="h-16" />
    </>
  );
}