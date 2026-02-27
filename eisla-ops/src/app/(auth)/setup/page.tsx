import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import SetupForm from "@/components/auth/SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // If any admin exists, redirect to login
  const existingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  if (existingAdmins.length > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal">Eisla Ops Hub</h1>
          <p className="mt-2 text-sm text-gray-500">
            Create the initial admin account
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
