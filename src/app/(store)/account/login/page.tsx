import { redirect } from "next/navigation";
import { getCustomerSessionServer } from "@/lib/customer-session";
import { CustomerAuthClient } from "./CustomerAuthClient";

export const metadata = {
  title: "Client Sign In & Studio Account — Clay & Co.",
  description:
    "Sign in to review bespoke orders, track freight delivery, and manage architectural project palettes.",
};

export default async function CustomerLoginPage() {
  const session = await getCustomerSessionServer();
  if (session) {
    redirect("/account");
  }

  return (
    <div className="min-h-[80vh] bg-[#faf7f0] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="mx-auto max-w-md w-full mb-6 text-center">
        <span className="inline-block rounded-full bg-stone-200/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
          Client Portal
        </span>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-stone-900">
          Welcome to Clay &amp; Co.
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          Access your architectural sample orders, dispatch tracking, and saved specs.
        </p>
      </div>

      <CustomerAuthClient />
    </div>
  );
}
