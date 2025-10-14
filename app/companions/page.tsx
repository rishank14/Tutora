import {
   getAllCompanions,
   getBookmarkedCompanions,
} from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { auth } from "@clerk/nextjs/server";

type SearchParams = {
   searchParams: {
      subject?: string;
      topic?: string;
      [key: string]: any;
   };
};

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
   const filters = await searchParams;
   const subject = filters.subject ? filters.subject : "";
   const topic = filters.topic ? filters.topic : "";

   const companions = await getAllCompanions({ subject, topic });

   const { userId } = await auth();

   const bookmarkedCompanions = userId
      ? await getBookmarkedCompanions(userId)
      : [];

   // Add a boolean `bookmarked` property to each companion
   const companionsWithBookmark = companions.map((c: any) => ({
      ...c,
      bookmarked: bookmarkedCompanions.some((b: any) => b.id === c.id),
   }));

   return (
      <main>
         <section className="flex justify-between gap-4 max-sm:flex-col">
            <h1>Companion Library</h1>
            <div className="flex gap-4">
               <SearchInput />
               <SubjectFilter />
            </div>
         </section>
         <section className="companions-grid">
            {companionsWithBookmark.map((companion: any) => (
               <CompanionCard
                  key={companion.id}
                  {...companion}
                  color={getSubjectColor(companion.subject)}
               />
            ))}
         </section>
      </main>
   );
};

export default CompanionsLibrary;
