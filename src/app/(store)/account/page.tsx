import { redirect } from "next/navigation";
import { getCustomerSessionServer } from "@/lib/customer-session";
import { CustomerService } from "@/services/customer.service";
import { CustomerDashboardClient } from "./CustomerDashboardClient";

export const metadata = {
  title: "Client Dashboard — Clay & Co.",
  description: "Manage your artisanal orders, freight delivery, and architectural projects.",
};

export default async function CustomerAccountPage() {
  const session = await getCustomerSessionServer();
  if (!session) {
    redirect("/account/login");
  }

  let profile: Awaited<ReturnType<typeof CustomerService.getProfile>>;
  try {
    profile = await CustomerService.getProfile(session.customerId);
  } catch (err) {
    console.error("Failed to load customer profile:", err);
    redirect("/account/login");
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-stone-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
            Account Management
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Client Studio Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Track order delivery, manage saved site delivery addresses, and review saved project
            palettes.
          </p>
        </div>

        <CustomerDashboardClient
          initialCustomer={profile.customer as any}
          initialAddresses={profile.addresses as any}
          initialOrders={profile.orders as any}
        />
      </div>
    </div>
  );
}
