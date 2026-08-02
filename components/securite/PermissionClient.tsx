"use client";
import { ReactNode } from "react";
export default function PermissionClient({code,permissions=[],superAdministrateur=false,children,sinon=null}:{code:string;permissions?:string[];superAdministrateur?:boolean;children:ReactNode;sinon?:ReactNode}) {
  const ok=superAdministrateur||permissions.includes("*")||permissions.includes(code);
  return ok?children:sinon;
}
