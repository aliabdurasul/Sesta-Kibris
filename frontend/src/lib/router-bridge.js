"use client";

import React, { useEffect } from "react";
import { useRouter, useParams as useNextParams, usePathname } from "next/navigation";
import NextLink from "next/link";

export function useNavigate() {
  const router = useRouter();
  return (path, options) => {
    if (path === -1) {
      router.back();
    } else if (typeof path === "string") {
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    }
  };
}

export function useParams() {
  return useNextParams() || {};
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname: pathname || "/" };
}

export function Link({ to, children, className, ...props }) {
  return (
    <NextLink href={to} className={className} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, children, className, end, style, ...props }) {
  const pathname = usePathname() || "/";
  const isActive = end ? pathname === to : pathname.startsWith(to);
  
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
  const resolvedStyle = typeof style === "function" ? style({ isActive }) : style;
  
  return (
    <NextLink href={to} className={resolvedClassName} style={resolvedStyle} {...props}>
      {typeof children === "function" ? children({ isActive }) : children}
    </NextLink>
  );
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router, to, replace]);
  return null;
}

export function Outlet({ children }) {
  // In Next.js App Router, the children prop handles the nested layout
  return <>{children}</>;
}
