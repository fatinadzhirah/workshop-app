import BrandHeader from "@/components/BrandHeader";
import SignupForm from "@/components/SignupForm";
import { safeNextPath } from "@/lib/redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <SignupForm next={safeNextPath(next)} />
    </div>
  );
}
