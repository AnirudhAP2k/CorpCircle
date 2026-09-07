import { auth } from '@/auth';
import EventsForm from '@/components/shared/EventsForm'
import { getUserPrimaryOrganization } from '@/domain/users';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async () => {
  const session = await auth();

  const userId = session?.user.id as string;

  if (!userId) {
    redirect('/login');
  }

  // Fetch user's organization
  const organization = await getUserPrimaryOrganization(userId);

  if (!organization) {
    return (
      <div className="min-h-screen bg-nx-surface-container-low text-nx-on-surface">
        <section className="bg-nx-surface-container bg-dotted-pattern bg-cover bg-center py-8 md:py-12">
          <h1 className="wrapper text-center font-headline text-3xl font-bold tracking-tight sm:text-left md:text-4xl">
            Create Event
          </h1>
        </section>

        <div className="wrapper my-8">
          <div className="rounded-2xl border border-nx-error/20 bg-nx-error-container p-5 text-center shadow-nx-card sm:p-6">
            <h2 className="mb-2 font-headline text-lg font-semibold text-nx-on-error-container">
              Organization Required
            </h2>
            <p className="mb-4 text-nx-on-error-container">
              You must belong to an organization to create events.
            </p>
            <a
              href="/onboarding"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-nx-primary px-6 py-2 font-medium text-nx-on-primary transition-opacity hover:opacity-90"
            >
              Create Organization
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nx-surface-container-low text-nx-on-surface">
      <section className="bg-nx-surface-container bg-dotted-pattern bg-cover bg-center py-8 md:py-12">
        <h1 className="wrapper text-center font-headline text-3xl font-bold tracking-tight sm:text-left md:text-4xl">
          Create Event
        </h1>
      </section>

      <div className="wrapper my-6 sm:my-8">
        <EventsForm
          userId={userId}
          type="Create"
          organizationId={organization.id}
          organizationName={organization.name}
          defaultCurrency={organization.preferredCurrency === "INR" ? "INR" : "USD"}
        />
      </div>
    </div>
  )
}

export default page
