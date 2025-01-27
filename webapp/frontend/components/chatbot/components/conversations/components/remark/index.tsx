import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export const Remark = ({ markdownContext }: { markdownContext: string }) => {
  return (
    <Markdown rehypePlugins={[rehypeHighlight]} remarkPlugins={[remarkGfm]}>
      {markdownContext}
    </Markdown>
  );
};
