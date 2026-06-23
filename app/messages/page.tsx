export default function MessagesPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-6 py-12">

        <h1 className="text-5xl font-black">
          Messages
        </h1>

        <div className="bg-white mt-8 rounded-3xl shadow h-[700px] flex">

          <div className="w-80 border-r p-4">

            <h2 className="font-bold mb-4">
              Conversations
            </h2>

            <div className="space-y-3">

              <div className="p-4 rounded-2xl bg-slate-100">
                Ahmed Khan
              </div>

              <div className="p-4 rounded-2xl bg-slate-100">
                Ali Raza
              </div>

            </div>

          </div>

          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select a conversation
          </div>

        </div>

      </div>

    </main>
  );
}