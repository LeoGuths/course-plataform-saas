import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ComponentProps } from 'react';
import Link from 'next/link';
import Logo from '@/assets/logo.svg';
import LogoIcon from '@/assets/logo-icon.svg';
import { NavItems } from '@/components/shared/app-sidebar/nav-items';
import { NavUser } from '@/components/shared/app-sidebar/nav-user';

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export const AppSideBar = ({ ...props }: AppSidebarProps) => {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <Link href="/">
          <Logo className="w-full max-w-[150px] mx-auto pt-3 sm:hidden group-data-[state=expanded]:block" />
          <LogoIcon className="w-full max-w-[20px] mx-auto pt-3 hidden group-data-[state=collapsed]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavItems />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
