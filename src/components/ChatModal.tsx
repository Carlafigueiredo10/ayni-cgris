import React, { useState } from "react";

const ChatModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState([
    { sender: "agente", text: "Olá! Sou o agente de IA. Como posso ajudar?" },
  ]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { sender: "agente", text: data.response || "Erro ao responder." }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { sender: "agente", text: "Erro ao conectar ao servidor." }]);
    }
    setInput("");
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Bate-papo com agente IA</h2>
        <div className="h-64 overflow-y-auto border rounded p-2 mb-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 text-sm ${msg.sender === "user" ? "text-right" : "text-left"}`}>
              <span className={msg.sender === "user" ? "text-primary" : "text-accent"}>{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
          />
          <button className="bg-primary text-white px-4 py-1 rounded" onClick={handleSend} disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
