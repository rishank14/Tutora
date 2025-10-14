import { getCompanion } from "@/lib/actions/companion.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import CompanionComponent from "@/components/CompanionComponent";

interface CompanionSessionPageProps {
   params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
   const { id } = await params;
   const companion = await getCompanion(id);
   const user = await currentUser();

   const { name, subject, title, topic, duration } = companion;

   if (!user) redirect("/sign-in");
   if (!name) redirect("/companions");

   return (
      <main>
         <article className="flex rounded-border justify-between p-6 max-md:flex-col max-sm:p-3 max-sm:gap-3">
            <div className="flex items-center gap-2 max-md:gap-3 max-sm:gap-2">
               <div
                  className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
                  style={{ backgroundColor: getSubjectColor(subject) }}
               >
                  <Image
                     src={`/icons/${subject}.svg`}
                     alt={subject}
                     width={35}
                     height={35}
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                     <p className="font-bold text-2xl max-md:text-xl max-sm:text-lg">
                        {name}
                     </p>
                     <div className="subject-badge max-sm:hidden text-sm max-md:text-xs">
                        {subject}
                     </div>
                  </div>
                  <p className="text-lg max-md:text-base max-sm:text-sm">
                     {topic}
                  </p>
               </div>
            </div>

            <div className="items-start text-2xl max-md:hidden max-sm:text-lg">
               {duration} minutes
            </div>
         </article>

         <CompanionComponent
            {...companion}
            companionId={id}
            userName={user.firstName!}
            userImage={user.imageUrl!}
         />
      </main>
   );
};

export default CompanionSession;
