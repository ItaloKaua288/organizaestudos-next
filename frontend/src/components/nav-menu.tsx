"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type NavMenuProps = ComponentProps<typeof NavigationMenu> & {
  vertical?: boolean;
};

export const NavMenu = ({ vertical, ...props }: NavMenuProps) => (
  <NavigationMenu {...props}>
    <NavigationMenuList vertical={vertical} className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start ">
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#" />}>Dashboard</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#" />}>Matérias</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#" />}>Revisões</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#" />}>Notas</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
