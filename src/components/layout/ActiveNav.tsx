'use client'

import { usePathname } from 'next/navigation'
import type { NavItem } from '@/config/site'
import { BottomNavList, DesktopNavList } from './NavList'

export function ActiveDesktopNav({ items }: { items: NavItem[] }) {
  return <DesktopNavList items={items} pathname={usePathname()} />
}

export function ActiveBottomNav({ items }: { items: NavItem[] }) {
  return <BottomNavList items={items} pathname={usePathname()} />
}
