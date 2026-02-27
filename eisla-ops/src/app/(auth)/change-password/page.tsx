import { createClient } from "@/lib/supabase/server";
import { getUserByEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/login");
  }

  const dbUser = await getUserByEmail(authUser.email);
  if (!dbUser) {
    redirect("/login");
  }

  // Only show this page if user must change password
  if (!dbUser.mustChangePw || dbUser.mustChangePw === "false") {
    if (dbUser.role === "engineer") {
      redirect("/reviews");
    }
    redirect("/ops");
  }

  const isCompromise = dbUser.mustChangePw === "compromise";

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal">Change Password</h1>
          <p className="mt-2 text-sm text-gray-500">
            You must set a new password before continuing
          </p>
        </div>
        <ChangePasswordForm userId={dbUser.id} isCompromise={isCompromise} />
      </div>
    </div>
  );
}
