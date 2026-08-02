import { ReactNode } from "react";
import { aPermission, PerimetrePermission } from "@/lib/securite/rbac";

type Props = {
  permission: string;
  perimetre?: PerimetrePermission;
  children: ReactNode;
  fallback?: ReactNode;
};

export default async function PermissionServeur({
  permission,
  perimetre,
  children,
  fallback = null,
}: Props) {
  const autorise = await aPermission(permission, perimetre);
  return autorise ? children : fallback;
}
