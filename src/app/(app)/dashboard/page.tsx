"use client"

import { useRouter } from "next/navigation"; 
 
 
export default function Dashboard() {
    const router = useRouter()

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <main className="w-full max-w-sm md:max-w-4xl"> 
         <button onClick={logout} className="border px-3 py-2 rounded">
          Logout
        </button>
      </main>
    </div>
  );
}
