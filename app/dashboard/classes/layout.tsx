import { ReactNode } from "react";
import { exigerPermission } from "@/lib/securite/rbac";
export default async function Layout({children}:{children:ReactNode}){await exigerPermission("CLASSES_VOIR","app/dashboard/classes");return children;}
