import { TextBot, TextClient } from "./components";

export const Message = ({ ...props }) => {
  const { type, context, dialogueOrder, key } = props;

  return (
    <>
      {type === "bot" ? (
        <TextBot
          key={key}
          context={context}
          defaultContext={context}
          dialogueOrder={dialogueOrder}
        />
      ) : (
        <TextClient context={context} dialogueOrder={dialogueOrder} />
      )}
    </>
  );
};
