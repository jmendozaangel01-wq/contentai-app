export default function Loader({ text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#00D084] rounded-full animate-spin" />
      {text && <p className="text-[#888888] text-sm">{text}</p>}
    </div>
  );
}
