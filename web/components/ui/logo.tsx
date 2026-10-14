import { MessageCircleIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
type LogoProps = ComponentPropsWithoutRef<"svg">;
function Logo({ className, ...props }: LogoProps) {
  return <MessageCircleIcon aria-hidden="true" className={["size-5 shrink-0", className].filter(Boolean).join(" ")} {...props} />;
}
export { Logo };
export type { LogoProps };
