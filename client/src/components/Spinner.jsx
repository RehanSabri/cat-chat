export default function Spinner() {
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="spinner"></div>
      <p className="text-lg text-gray-400 font-medium">Looking for a stranger...</p>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}
