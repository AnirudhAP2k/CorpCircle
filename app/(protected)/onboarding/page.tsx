import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OrganizationForm from "@/components/shared/OrganizationForm";
import { getAllIndustries } from "@/data/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OnboardingPage = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (session.user.hasCompletedOnboarding) {
        redirect("/dashboard");
    }

    const industries = await getAllIndustries();

    return (
        <div className="min-h-screen bg-nx-surface-container-low flex items-center justify-center p-4 sm:p-6">
            <Card className="w-full max-w-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest text-nx-on-surface shadow-nx-card rounded-2xl">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="font-headline text-3xl font-bold text-nx-on-surface">Welcome to CorpConnect</CardTitle>
                    <CardDescription className="font-body text-base text-nx-on-surface-variant">
                        Let&apos;s get started by creating your organization profile.
                        This will help other businesses discover and connect with you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <OrganizationForm
                        userId={session.user.id}
                        type="Create"
                        industries={industries}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPage;
