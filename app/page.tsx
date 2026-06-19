import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionsList";
import CTA from "@/components/CTA";
import {
   getAllCompanions,
   getRecentSessions,
   getBookmarkedCompanions,
} from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

const Page = async () => {
   // Get current user
   const { userId } = await auth();

   const companions = await getAllCompanions({ limit: 3 });
   const recentSessionsCompanions = await getRecentSessions(10);

   const bookmarkedCompanions = userId
      ? await getBookmarkedCompanions(userId)
      : [];

   // Add bookmarked boolean to popular companions
   const popularWithBookmark = companions.map((c: Companion) => ({
      ...c,
      bookmarked: bookmarkedCompanions.some((b: Companion) => b.id === c.id),
   }));

   return (
      <main>
         <h1>Popular Companions</h1>

         <section className="home-section">
            {popularWithBookmark.map((companion: Companion & { bookmarked: boolean }) => (
               <CompanionCard
                  key={companion.id}
                  {...companion}
                  color={getSubjectColor(companion.subject)}
               />
            ))}
         </section>

         <section className="home-section">
            <CompanionsList
               title="Recently completed sessions"
               companions={recentSessionsCompanions}
               classNames="w-2/3 max-lg:w-full"
            />
            <CTA />
         </section>
      </main>
   );
};

export default Page;
