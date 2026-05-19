import { MessageComposer } from "./components/MessageComposer";
import { MessagesList } from "./components/MessagesList";

export const MessagesPage = () => {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <MessageComposer/>
      <MessagesList />
    </div>
  );
};
