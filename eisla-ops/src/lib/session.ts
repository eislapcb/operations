import { createClient } from "@/lib/supabase/server";
import { getUserByEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function requireSession(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/login");
  }

  const dbUser = await getUserByEmail(authUser.email);
  if (!dbUser || !dbUser.active) {
    redirect("/login");
  }

  // Force password change if needed
  if (dbUser.mustChangePw && dbUser.mustChangePw !== "false") {
    redirect("/change-password");
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as Role,
  };
}

export async function requireRole(
  ...allowedRoles: Role[]
): Promise<SessionUser> {
  const user = await requireSession();
  if (!allowedRoles.includes(user.role)) {
    redirect("/ops");
  }
  return user;
}
