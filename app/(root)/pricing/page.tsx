import { auth } from "@/auth";
import { PublicPricing } from "@/components/billing/PublicPricing";

export const metadata = {
    title: "Pricing — CorpConnect",
    description: "CorpConnect plans for professional B2B networking. USD and INR, monthly or yearly.",
};

export default async function PricingPage() {
    const session = await auth();
    return <PublicPricing isSignedIn={Boolean(session?.user)} />;
}
