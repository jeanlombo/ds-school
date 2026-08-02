import { exigerPermission } from "./rbac";
export function actionProtegee<TArgs extends unknown[], TResult>(permission:string, action:(...args:TArgs)=>Promise<TResult>) {
  return async (...args:TArgs):Promise<TResult> => { await exigerPermission(permission); return action(...args); };
}
