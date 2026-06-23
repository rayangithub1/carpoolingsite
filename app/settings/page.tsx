export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <div className="max-w-4xl mx-auto px-6 py-12">

        <h1 className="text-5xl font-black">
          Settings
        </h1>

        <div className="bg-white rounded-3xl shadow mt-8 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Account Settings
          </h2>

          <div className="space-y-6">

            <input
              type="text"
              placeholder="Full Name"
              className="w-full border rounded-xl p-4"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-xl p-4"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border rounded-xl p-4"
            />

            <button className="px-6 py-4 rounded-xl bg-cyan-500 text-white">
              Save Changes
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}