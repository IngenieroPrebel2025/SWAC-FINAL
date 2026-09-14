"use client";

import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { RouteCard } from "@/components/molecules/RouteCard";
import { getChildren, getNode } from "@/config/navigation";
import { useFilteredNavigation } from "@/hooks/useNavigation";

/** Landing page that lists the subsections (visible to the user) of a parent route. */
export function SectionIndex({ parentHref }: { parentHref: string }) {
  const navigation = useFilteredNavigation();
  const node = getNode(parentHref);
  const children = getChildren(parentHref, navigation);

  return (
    <PageContainer>
      <PageHeader title={node?.label ?? "Sección"} description={node?.description} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        {children.map((route) => (
          <RouteCard key={route.href} route={route} />
        ))}
      </div>
    </PageContainer>
  );
}
