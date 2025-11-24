// /pages/admin/support.tsx
import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  email: string;
  message: string;
  createdAt: string;
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-support-tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🎫 Mesaje suport tehnic</h1>

      {loading ? (
        <p className="text-center">Se încarcă...</p>
      ) : tickets.length === 0 ? (
        <p className="text-center text-gray-400">Nu există mesaje trimise.</p>
      ) : (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition"
            >
              <p className="text-sm text-gray-400 mb-1">📧 {ticket.email}</p>
              <p className="mb-2">{ticket.message}</p>
              <p className="text-xs text-gray-500">
                🕒 {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
