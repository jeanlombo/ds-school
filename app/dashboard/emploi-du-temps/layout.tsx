import { ReactNode } from "react";
import { exigerPermission } from "@/lib/securite/rbac";
export default async function Layout({children}:{children:ReactNode}){await exigerPermission("EMPLOI_DU_TEMPS_VOIR");return children;}
