import "@/styles/dot-typing.css";

export const DotTyping = () => {
  return (
    <div className="flex flex-start">
      <span className="w-1 h-1 bg-gray-300 dot bounce" />
      <span className="w-1 h-1 bg-gray-300 dot bounce2" />
      <span className="w-1 h-1 bg-gray-300 dot bounce3" />
    </div>
  );
};
