import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex bg-background">
      <Sidebar nombreEntrenador={session.user.name ?? ""} />
      <main className="min-h-screen flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
