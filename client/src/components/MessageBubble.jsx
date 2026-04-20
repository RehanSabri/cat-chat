export default function MessageBubble({ message }) {
  const { sender, text, timestamp } = message;

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (sender === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <span className="text-xs text-gray-500 bg-dark-lighter px-3 py-1.5 rounded-full">
          {text}
        </span>
      </div>
    );
  }

  const isMe = sender === 'me';

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 animate-slide-up`}
    >
      <div
        className={`message-bubble ${
          isMe
            ? 'bg-accent text-white rounded-br-md'
            : 'bg-stranger text-gray-200 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed">{text}</p>
        <p
          className={`text-[10px] mt-1 ${
            isMe ? 'text-white/50 text-right' : 'text-gray-500 text-left'
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
