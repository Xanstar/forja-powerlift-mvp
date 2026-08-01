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
    <div className="min-h-screen bg-background md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <Sidebar nombreEntrenador={session.user.name ?? ""} />
      <main className="min-w-0 px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
