"use client";

import { useEffect, useRef, useState } from "react";
import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/lib/actions/companion.actions";

enum CallStatus {
   INACTIVE = "INACTIVE",
   CONNECTING = "CONNECTING",
   ACTIVE = "ACTIVE",
   FINISHED = "FINISHED",
}

interface CompanionComponentProps {
   companionId: string;
   subject: string;
   topic: string;
   name: string;
   userName: string;
   userImage: string;
   style: string;
   voice: string;
}

interface Message {
   type: string;
   transcriptType?: string;
   role: "assistant" | "user";
   transcript?: string;
}

interface SavedMessage {
   role: "assistant" | "user";
   content: string;
}

const CompanionComponent = ({
   companionId,
   subject,
   topic,
   name,
   userName,
   userImage,
   style,
   voice,
}: CompanionComponentProps) => {
   const [callStatus, setCallStatus] = useState<CallStatus>(
      CallStatus.INACTIVE
   );
   const [isSpeaking, setIsSpeaking] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [messages, setMessages] = useState<SavedMessage[]>([]);

   const lottieRef = useRef<LottieRefCurrentProps>(null);

   // 🎵 Control Lottie animation based on speaking status
   useEffect(() => {
      if (isSpeaking) lottieRef.current?.play();
      else lottieRef.current?.stop();
   }, [isSpeaking]);

   // 🎧 Vapi event handling
   useEffect(() => {
      const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
      const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

      const onMessage = (message: Message) => {
         if (
            message.type === "transcript" &&
            message.transcriptType === "final"
         ) {
            const newMessage = {
               role: message.role,
               content: message.transcript || "",
            };
            setMessages((prev) => [newMessage, ...prev]);
         }
      };

      const onSpeechStart = () => setIsSpeaking(true);
      const onSpeechEnd = () => setIsSpeaking(false);
      const onError = (error: Error) => console.error("Error:", error);

      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("message", onMessage);
      vapi.on("error", onError);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("speech-end", onSpeechEnd);

      return () => {
         vapi.off("call-start", onCallStart);
         vapi.off("call-end", onCallEnd);
         vapi.off("message", onMessage);
         vapi.off("error", onError);
         vapi.off("speech-start", onSpeechStart);
         vapi.off("speech-end", onSpeechEnd);
      };
   }, []);

   // 🎤 Toggle microphone state
   const toggleMicrophone = () => {
      const muted = vapi.isMuted();
      vapi.setMuted(!muted);
      setIsMuted(!muted);
   };

   // 📞 Start a new session
   const handleCall = async () => {
      setCallStatus(CallStatus.CONNECTING);
      addToSessionHistory(companionId);

      const assistantOverrides = {
         variableValues: { subject, topic, style },
         clientMessages: ["transcript"],
         serverMessages: [],
      };

      // @ts-expect-error - custom SDK typing
      vapi.start(configureAssistant(voice, style), assistantOverrides);
   };

   // 🔚 End current session
   const handleDisconnect = () => {
      setCallStatus(CallStatus.FINISHED);
      vapi.stop();
   };

   return (
      <section className="flex flex-col min-h-[70vh] max-h-[90vh] h-screen">
         {/* Avatar + User Section */}
         <section className="flex flex-col lg:flex-row gap-8">
            {/* Assistant Avatar */}
            <div className="companion-section w-full lg:w-2/3">
               <div
                  className="companion-avatar"
                  style={{ backgroundColor: getSubjectColor(subject) }}
               >
                  {/* Static subject icon */}
                  <div
                     className={cn(
                        "absolute transition-opacity duration-1000",
                        callStatus === CallStatus.FINISHED ||
                           callStatus === CallStatus.INACTIVE
                           ? "opacity-100"
                           : "opacity-0",
                        callStatus === CallStatus.CONNECTING &&
                           "opacity-100 animate-pulse"
                     )}
                  >
                     <Image
                        src={`/icons/${subject}.svg`}
                        alt={subject}
                        width={150}
                        height={150}
                        className="max-sm:w-fit"
                     />
                  </div>

                  {/* Lottie animation when speaking */}
                  <div
                     className={cn(
                        "absolute transition-opacity duration-1000",
                        callStatus === CallStatus.ACTIVE
                           ? "opacity-100"
                           : "opacity-0"
                     )}
                  >
                     <Lottie
                        lottieRef={lottieRef}
                        animationData={soundwaves}
                        autoplay={false}
                        className="companion-lottie"
                     />
                  </div>
               </div>
               <p className="font-bold text-2xl">{name}</p>
            </div>

            {/* User Section */}
            <div className="user-section w-full lg:w-1/3">
               <div className="user-avatar">
                  <Image
                     src={userImage}
                     alt={userName}
                     width={130}
                     height={130}
                     className="rounded-lg"
                  />
                  <p className="font-bold text-2xl">{userName}</p>
               </div>

               {/* Microphone Button */}
               <button
                  className="btn-mic"
                  onClick={toggleMicrophone}
                  disabled={callStatus !== CallStatus.ACTIVE}
               >
                  <Image
                     src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
                     alt="mic"
                     width={36}
                     height={36}
                  />
                  <p className="max-sm:hidden">
                     {isMuted ? "Turn on microphone" : "Turn off microphone"}
                  </p>
               </button>

               {/* Start / End Session Button */}
               <button
                  className={cn(
                     "rounded-lg py-2 cursor-pointer transition-colors w-full text-white",
                     callStatus === CallStatus.ACTIVE
                        ? "bg-red-700"
                        : "bg-primary",
                     callStatus === CallStatus.CONNECTING && "animate-pulse"
                  )}
                  onClick={
                     callStatus === CallStatus.ACTIVE
                        ? handleDisconnect
                        : handleCall
                  }
               >
                  {callStatus === CallStatus.ACTIVE
                     ? "End Session"
                     : callStatus === CallStatus.CONNECTING
                     ? "Connecting"
                     : "Start Session"}
               </button>
            </div>
         </section>

         {/* Transcript Section */}
         <section className="transcript">
            <div className="transcript-message no-scrollbar">
               {messages.map((message, index) => {
                  if (message.role === "assistant") {
                     return (
                        <p key={index} className="max-sm:text-sm">
                           {name.split(" ")[0].replace(/[.,]/g, ",")}:{" "}
                           {message.content}
                        </p>
                     );
                  } else {
                     return (
                        <p key={index} className="text-primary max-sm:text-sm">
                           {userName}: {message.content}
                        </p>
                     );
                  }
               })}
            </div>
            <div className="transcript-fade" />
         </section>
      </section>
   );
};

export default CompanionComponent;
