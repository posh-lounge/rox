"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "@/icons/index";
import SidebarWidget from "@/context/SidebarWidget";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  BarChart2,
  Home,
  ClipboardList,
  Users,
  ShoppingBag,
  Building2,
  Boxes,
  FileText,
  StickyNote,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// ─── Main nav ────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={18} />,
    name: "Dashboard",
    path: "/dashboard",
  },

  // ── Business Core ───────────────────────────────────────────

   {
    name: "Products",
    icon: <Package size={18} />,
    path: "/dashboard/products",
  },
  {
    name: "Purchases",
    icon: <TrendingUp size={18} />,
    path: "/dashboard/purchases",
  },
  {
    name: "Sales Cart",
    icon: <ShoppingCart size={18} />,
    path: "/dashboard/cart",
  },
  {
    name: "Sales",
    icon: <ShoppingBag size={18} />,
    path: "/dashboard/sales",
  },

  // ── Spaces ──────────────────────────────────────────────────
  {
    name: "Spaces",
    icon: <Building2 size={18} />,
    path: "/dashboard/spaces",
  },

    // ── Expenses ───────────────────────────────────────────────────
  {
    name: "Expenses",
    icon: <GridIcon size={18} />,
    path: "/dashboard/expenses",
  },

  // ── Stock ───────────────────────────────────────────────────
  {
    name: "Stock",
    icon: <Boxes size={18} />,
    path: "/dashboard/stock",
  },


  // ── Stock ───────────────────────────────────────────────────
  {
    name: "Loan Account",
    icon: <FileText size={18} />,
    path: "/dashboard/loan-account",
  },

  

  // ── Reports ─────────────────────────────────────────────────
  {
    name: "Reports",
    icon: <BarChart2 size={18} />,
    path: "/dashboard/reports",
  },

];

// ─── Others nav ──────────────────────────────────────────────
const othersItems: NavItem[] = [
  {
    icon: <Users size={18} />,
    name: "Users",
    path: "/dashboard/users",
  },
  
];

// ─── Sidebar component ───────────────────────────────────────
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  }, [pathname]);

  useEffect(() => {
    let matched = false;
    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((sub) => {
            if (isActive(sub.path)) {
              setOpenSubmenu({ type: menuType, index });
              matched = true;
            }
          });
        }
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight(prev => ({ ...prev, [key]: subMenuRefs.current[key]?.scrollHeight || 0 }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(prev =>
      prev && prev.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const isExpand = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active" : "menu-item-inactive"
              } cursor-pointer ${!isExpand ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                {nav.icon}
              </span>
              {isExpand && <span className="menu-item-text">{nav.name}</span>}
              {isExpand && (
                <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                }`} />
              )}
            </button>
          ) : nav.path ? (
            <Link href={nav.path}
              className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
              <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                {nav.icon}
              </span>
              {isExpand && <span className="menu-item-text">{nav.name}</span>}
            </Link>
          ) : null}

          {nav.subItems && isExpand && (
            <div
              ref={el => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map(sub => (
                  <li key={sub.name}>
                    <Link href={sub.path}
                      className={`menu-dropdown-item ${isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                      {sub.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {sub.new && <span className={`ml-auto ${isActive(sub.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>new</span>}
                        {sub.pro && <span className={`ml-auto ${isActive(sub.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpand ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpand ? (
            <Image width={120} height={32} src="/logo-600x156.png" alt="Logo" />
          ) : (
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Main menu */}
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpand ? "lg:justify-center" : "justify-start"}`}>
                {isExpand ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Others */}
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpand ? "lg:justify-center" : "justify-start"}`}>
                {isExpand ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpand && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
