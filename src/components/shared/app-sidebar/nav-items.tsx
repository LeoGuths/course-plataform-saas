'use client';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  BookOpen,
  BookUp2,
  ChartArea,
  MessageCircle,
  SquareDashedBottomCode,
  Trophy,
  Users,
} from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { getPurchasedCourses } from '@/actions/courses';

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export const NavItems = () => {
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === 'admin';

  const { data: purchasedCourses } = useQuery({
    queryKey: queryKeys.purchasedCourses,
    queryFn: () => getPurchasedCourses(),
  });

  const navItems: NavItem[] = [
    {
      label: 'Cursos',
      path: '/',
      icon: SquareDashedBottomCode,
    },
    ...(purchasedCourses?.length
      ? [
          {
            label: 'Meus Cursos',
            path: '/my-courses',
            icon: BookUp2,
          },
        ]
      : []),
    {
      label: 'Ranking',
      path: '/ranking',
      icon: Trophy,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: 'Estatísticas',
      path: '/admin',
      icon: ChartArea,
    },
    {
      label: 'Gerenciar Cursos',
      path: '/admin/courses',
      icon: BookOpen,
    },
    {
      label: 'Gerenciar Usuários',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Gerenciar Comentários',
      path: '/admin/comments',
      icon: MessageCircle,
    },
  ];

  const renderNavItems = (items: NavItem[]) => {
    return items.map(item => (
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton asChild tooltip={item.label}>
          <Link href={item.path}>
            <item.icon className="text-primary group-data-[collapsible=icon]:text-white hover:text-primary transition-all" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {renderNavItems(navItems)}

        {isAdmin && (
          <>
            <Separator className="my-2" />

            {renderNavItems(adminNavItems)}
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};
