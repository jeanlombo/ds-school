import { ReactNode } from "react";
import { exigerPermission } from "@/lib/securite/rbac";
export default async function Layout({children}:{children:ReactNode}){await exigerPermission("PARENTS_AJOUTER");return children;}
