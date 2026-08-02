import { ReactNode } from "react";
import { exigerPermission } from "@/lib/securite/rbac";
export default async function Layout({children}:{children:ReactNode}){await exigerPermission("ANNEES_SCOLAIRES_VOIR","app/dashboard/annees-scolaires");return children;}
