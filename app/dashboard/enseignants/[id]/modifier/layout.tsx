import { ReactNode } from "react";
import { exigerPermission } from "@/lib/securite/rbac";
export default async function Layout({children}:{children:ReactNode}){await exigerPermission("ENSEIGNANTS_MODIFIER");return children;}
