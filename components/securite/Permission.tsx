import { ReactNode } from "react";
import { aPermission } from "@/lib/securite/rbac";
export default async function Permission({code,children,sinon=null}:{code:string;children:ReactNode;sinon?:ReactNode}) {
  return (await aPermission(code)) ? children : sinon;
}
