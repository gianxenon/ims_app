import { LoginForm } from "@/src/components/login-form";

 
export default function Home() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <main className="w-full max-w-sm md:max-w-4xl"> 
        <LoginForm /> 
      </main>
    </div>
  );
}
