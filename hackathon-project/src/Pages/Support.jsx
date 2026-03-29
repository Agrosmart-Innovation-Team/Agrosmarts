import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import useSupportChat from "../features/support/useSupportChat";

export default function Support() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const {
    messageDraft,
    setMessageDraft,
    messages,
    quickReplies,
    apiError,
    isLoadingChat,
    isOfficerTyping,
    sendMessage,
  } = useSupportChat();

  const handleRequestCall = () => {
    sendMessage("Please call me when available for a quick consultation.");
  };

  const handlePickPhoto = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    sendMessage(`I have attached a crop photo: ${file.name}`);
    event.target.value = "";
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white px-4 pt-4 pb-28">
      <div className="relative flex min-h-[calc(100vh-13rem)] w-full flex-col overflow-hidden max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center bg-white dark:bg-background-dark p-4 border-b border-slate-100 dark:border-slate-800 justify-between sticky top-0 z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-background-dark rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col items-center flex-1">
            <h2 className="text-gray-900 dark:text-white text-base font-bold leading-tight">
              Officer Sarah
            </h2>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-primary"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Agricultural Extension Officer
              </span>
            </div>
          </div>
          <div className="flex w-10 items-center justify-end">
            <button
              type="button"
              onClick={handleRequestCall}
              aria-label="Request call from officer"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <span className="material-symbols-outlined">call</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col bg-slate-50 dark:bg-background-dark/50">
          {isLoadingChat && (
            <p className="text-xs text-primary text-center">
              Syncing support chat...
            </p>
          )}
          {apiError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              {apiError}
            </p>
          )}
          <div className="flex justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-slate-200/50 dark:bg-background-dark px-3 py-1 rounded-full">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {messages.map((message) => {
            const isFarmer = message.sender === "farmer";
            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 max-w-[85%] ${isFarmer ? "self-end justify-end" : ""}`}
              >
                {!isFarmer && (
                  <div className="size-8 shrink-0 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    OS
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 ${isFarmer ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`text-xs font-medium text-gray-500 ${isFarmer ? "mr-1" : "ml-1"}`}
                  >
                    {isFarmer ? "Farmer" : "Officer Sarah"} • {message.time}
                  </div>
                  <div
                    className={`text-sm font-normal leading-relaxed px-4 py-3 shadow-sm border ${
                      isFarmer ?
                        "rounded-2xl rounded-br-none bg-primary text-gray-900 border-primary/40"
                      : "rounded-2xl rounded-bl-none bg-white dark:bg-background-dark text-gray-800 dark:text-gray-200 border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {isFarmer && (
                  <div className="size-8 shrink-0 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isOfficerTyping && (
            <div className="flex items-end gap-3 max-w-[85%]">
              <div className="size-8 shrink-0 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                OS
              </div>
              <div className="rounded-2xl rounded-bl-none bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                Officer Sarah is typing...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-background-dark rounded-full p-1 pl-4 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePickPhoto}
              aria-label="Attach crop photo"
              className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">
                add_a_photo
              </span>
            </button>
            <input
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              placeholder="Type your message..."
              type="text"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="bg-primary text-gray-900 size-9 rounded-full flex items-center justify-center shadow-md shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => sendMessage(reply)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-primary/30 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
