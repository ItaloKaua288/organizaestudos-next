"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type NavMenuProps = ComponentProps<typeof NavigationMenu> & {
  vertical?: boolean;
};

export const NavMenu = ({ vertical, ...props }: NavMenuProps) => (
  <NavigationMenu {...props}>
    <NavigationMenuList vertical={vertical} className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start ">
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/" />}>Dashboard</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Estudos</NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/materias" />}>Matérias</NavigationMenuLink>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/revisoes" />}>Revisões</NavigationMenuLink>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/notas" />}>Notas</NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Planejamento</NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/cronograma" />}>Cronograma</NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
