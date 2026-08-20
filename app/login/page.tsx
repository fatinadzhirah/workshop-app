import BrandHeader from "@/components/BrandHeader";
import LoginForm from "@/components/LoginForm";
import { safeNextPath } from "@/lib/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <LoginForm confirmError={error === "confirm"} next={safeNextPath(next)} />
    </div>
  );
}
