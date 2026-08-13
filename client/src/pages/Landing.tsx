import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50">
      <nav className="max-w-6xl mx-auto flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center text-lg">
            📋
          </div>
          <span className="font-extrabold text-xl text-gray-800">TaskFlow</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-gray-700 font-medium hover:text-fuchsia-600 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <span className="inline-block bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold px-3 py-1 rounded-full mb-5">
          Real-time collaboration, built for teams
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Organize work,{" "}
          <span className="bg-gradient-to-r from-fuchsia-600 to-orange-500 bg-clip-text text-transparent">
            together, live.
          </span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          TaskFlow keeps every teammate looking at the same board, the same moment,
          every time — no refreshing, no stale data, no "wait, who moved this?"
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/signup"
            className="px-7 py-3.5 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            Start for Free
          </Link>
          <Link
            to="/login"
            className="px-7 py-3.5 bg-white text-gray-700 rounded-xl font-semibold shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            I have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "⚡",
            title: "Real-Time Sync",
            desc: "Every card, list, and board update appears instantly for all collaborators — powered by WebSockets, not polling.",
            color: "from-amber-400 to-orange-500",
          },
          {
            icon: "🖱️",
            title: "Drag & Drop",
            desc: "Reorder tasks within a list or move them across stages with smooth, persistent drag-and-drop.",
            color: "from-teal-400 to-cyan-500",
          },
          {
            icon: "👥",
            title: "Team Workspaces",
            desc: "Invite teammates by email, share boards, and see who's viewing live with presence indicators.",
            color: "from-indigo-400 to-violet-500",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-sm`}
            >
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-r from-fuchsia-600 to-orange-500 rounded-3xl p-12 shadow-xl">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to organize your work?</h2>
          <p className="text-white/90 mb-8">Free to use. No credit card required.</p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3.5 bg-white text-fuchsia-600 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      <footer className="text-center text-gray-400 text-sm pb-8">
        Built with the MERN Stack — MongoDB, Express, React, Node.js
      </footer>
    </div>
  );
}