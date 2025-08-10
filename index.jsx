/*
Matrix Hacker Style Website (React single-file)

How to use:
- Place this file into a React + Tailwind project (e.g. Vite + React + Tailwind).
- This is a self-contained component (default export).
- You can load a users JSON file via the "Load users JSON" button; a sample users JSON is included below as `sample-users.json` (copy/paste into a file if you want).
- The admin user is named "Void" (case-sensitive). When you login as Void you get the admin panel to view and edit other users' visible content.
- You can add images (they are stored as data-URLs in the user's config), text blocks, and YouTube video URLs. You can also download the current users configuration as a JSON file.

Sample users JSON (save as `users.json` to import):
[
  {
    "id": "alice",
    "displayName": "Alice",
    "role": "user",
    "show": {
      "text": true,
      "image": true,
      "video": false
    },
    "text": "Hello, I'm Alice. Welcome to my corner.",
    "image": "", // data URL or relative path
    "video": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    "id": "bob",
    "displayName": "Bob",
    "role": "user",
    "show": { "text": true, "image": false, "video": false },
    "text": "Bob's short bio.",
    "image": "",
    "video": ""
  }
]

Notes & limitations:
- This is a front-end-only demo. For production you should persist users server-side (e.g. an API + DB) and secure authentication.
- For embedding YouTube, we simply place an iframe from the provided URL (we convert a watch URL to an embed URL).
- Image uploads are converted to data-URLs and kept in memory (and in the downloaded JSON if you export it).

Ready-to-run instructions (quick):
1) Create a new Vite React app: `npm create vite@latest my-app --template react` (or use create-react-app)
2) Install Tailwind and configure per Tailwind docs.
3) Drop this file into `src/components/MatrixSite.jsx` and import it from `App.jsx`.
4) Start dev server: `npm run dev`.

*/

import React, { useEffect, useMemo, useState } from "react";

// Helper: default sample users if none loaded
const DEFAULT_USERS = [
  {
    id: "void",
    displayName: "Void",
    role: "admin",
    show: { text: false, image: false, video: false },
    text: "I am Void — system administrator.",
    image: "",
    video: ""
  },
  {
    id: "neo",
    displayName: "Neo",
    role: "user",
    show: { text: true, image: true, video: false },
    text: "Follow the white rabbit.",
    image: "",
    video: ""
  }
];

function toEmbedUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }
  } catch (e) {
    return "";
  }
  return url;
}

export default function MatrixHackerSite() {
  const [users, setUsers] = useState(() => {
    // try load from localStorage
    const raw = localStorage.getItem("matrix_users_v1");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId) || null, [users, currentUserId]);

  useEffect(() => {
    localStorage.setItem("matrix_users_v1", JSON.stringify(users));
  }, [users]);

  // Matrix background characters animation
  const MatrixBg = () => (
    <div className="absolute inset-0 -z-10 bg-black text-green-400 overflow-hidden">
      <div className="matrix-grid w-full h-full opacity-20 pointer-events-none" />
      <style>{`
        .matrix-grid{
          background-image: radial-gradient(rgba(0,0,0,0.0) 1px, transparent 1px), linear-gradient(transparent 0, rgba(0,255,70,0.06) 1px);
          background-size: 30px 30px, 1px 20px;
          animation: shift 20s linear infinite;
        }
        @keyframes shift{ 0%{ transform: translateY(0);} 100%{ transform: translateY(-200px);} }
      `}</style>
    </div>
  );

  function handleLoadUsersFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          setUsers(parsed);
          alert("Users loaded from file");
        } else {
          alert("Die Datei enthält kein gültiges Array von Nutzern.");
        }
      } catch (err) {
        alert("Fehler beim Parsen der JSON-Datei: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handleDownloadUsers() {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function loginAs(id) {
    setCurrentUserId(id);
  }

  function logout() {
    setCurrentUserId(null);
  }

  function updateUser(updated) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  function deleteUser(id) {
    if (!confirm("User wirklich löschen?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function addUser() {
    const id = prompt("Neuer Nutzer-ID (klein, ohne Leerzeichen):");
    if (!id) return;
    if (users.some((u) => u.id === id)) {
      alert("ID existiert schon");
      return;
    }
    const newUser = {
      id,
      displayName: id,
      role: "user",
      show: { text: true, image: false, video: false },
      text: "",
      image: "",
      video: ""
    };
    setUsers((p) => [...p, newUser]);
  }

  // small component: login screen centered
  const LoginCard = () => (
    <div className="w-full max-w-md mx-auto p-6 bg-black/80 border border-green-600 rounded-2xl shadow-2xl">
      <h2 className="text-3xl font-mono text-green-300 text-center">LOGIN</h2>
      <p className="text-sm text-green-200/70 text-center mb-4">Enter ID (try <strong>void</strong> for admin)</p>
      <div className="flex gap-2">
        <input
          placeholder="user id"
          className="flex-1 bg-transparent border border-green-700 rounded px-3 py-2 text-green-200 font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter") loginAs(e.currentTarget.value.trim());
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('input[placeholder="user id"]');
            if (input) loginAs(input.value.trim());
          }}
          className="px-4 py-2 rounded bg-green-600/80 hover:bg-green-600 text-black font-semibold"
        >
          Go
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <select
          onChange={(e) => loginAs(e.target.value)}
          className="flex-1 bg-transparent border border-green-700 rounded px-3 py-2 text-green-200 font-mono"
          defaultValue=""
        >
          <option value="">-- quick login --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName} ({u.id})</option>
          ))}
        </select>
        <button onClick={() => {
          // load sample users
          if (confirm('Mit Standard-Nutzern überschreiben?')) { setUsers(DEFAULT_USERS); alert('Standard-Nutzer geladen'); }
        }} className="px-3 py-2 border border-green-700 rounded font-mono text-green-200">Reset</button>
      </div>
      <div className="mt-4 text-xs text-green-300/70 font-mono">
        <div>Oder: Lade eine users.json Datei:</div>
        <div className="mt-2 flex gap-2">
          <input type="file" accept="application/json" onChange={(e) => e.target.files && handleLoadUsersFile(e.target.files[0])} />
          <button onClick={handleDownloadUsers} className="px-3 py-1 rounded border border-green-700">Download current</button>
        </div>
      </div>
    </div>
  );

  // User card to show user's content
  const UserPanel = ({ user, editable }) => {
    return (
      <div className="p-4 bg-black/60 border border-green-700 rounded space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-mono text-green-200">{user.displayName} <span className="text-xs text-green-400">({user.id})</span></div>
            <div className="text-xs text-green-300/70">role: {user.role}</div>
          </div>
          {editable && (
            <div className="flex gap-2">
              <button onClick={() => {
                const edited = { ...user };
                const newName = prompt('Neuer Anzeigename:', user.displayName);
                if (newName != null) { edited.displayName = newName; updateUser(edited); }
              }} className="px-2 py-1 text-xs border border-green-700 rounded font-mono">Edit</button>
              <button onClick={() => deleteUser(user.id)} className="px-2 py-1 text-xs border border-red-600 rounded font-mono text-red-400">Del</button>
            </div>
          )}
        </div>

        {user.show.text && (
          <div className="font-mono text-green-200 text-sm whitespace-pre-wrap">{user.text}</div>
        )}

        {user.show.image && user.image && (
          <div className="w-full flex justify-center">
            <img src={user.image} alt="user media" className="max-h-48 object-contain border border-green-800 rounded" />
          </div>
        )}

        {user.show.video && user.video && (
          <div className="w-full aspect-video">
            <iframe title={`yt-${user.id}`} src={toEmbedUrl(user.video)} frameBorder="0" allowFullScreen className="w-full h-full rounded" />
          </div>
        )}
      </div>
    );
  };

  // Admin panel shown when currentUser is Void (admin) OR role === 'admin'
  const AdminPanel = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-mono text-green-200">Admin-Konsole — alle Nutzer</h3>
        <div className="flex gap-2">
          <button onClick={addUser} className="px-3 py-1 rounded border border-green-700">Neuer Nutzer</button>
          <button onClick={handleDownloadUsers} className="px-3 py-1 rounded border border-green-700">Export JSON</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div key={u.id} className="p-2">
            <UserPanel user={u} editable={true} />
            <UserEditor user={u} />
          </div>
        ))}
      </div>
    </div>
  );

  function UserEditor({ user }) {
    const [local, setLocal] = useState(user);
    useEffect(() => setLocal(user), [user]);
    function handleImageFile(file) {
      const r = new FileReader();
      r.onload = (e) => setLocal((l) => ({ ...l, image: e.target.result, show: { ...l.show, image: true } }));
      r.readAsDataURL(file);
    }
    return (
      <div className="mt-2 p-3 border-t border-green-900 text-sm font-mono">
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={local.show.text} onChange={(e) => setLocal({ ...local, show: { ...local.show, text: e.target.checked } })} /> Text
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={local.show.image} onChange={(e) => setLocal({ ...local, show: { ...local.show, image: e.target.checked } })} /> Bild
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={local.show.video} onChange={(e) => setLocal({ ...local, show: { ...local.show, video: e.target.checked } })} /> Video
          </label>
        </div>
        <div className="mt-2 space-y-2">
          <div>
            <div className="text-xs">Text</div>
            <textarea className="w-full bg-black/60 border border-green-800 rounded p-2 font-mono text-green-200" value={local.text} onChange={(e) => setLocal({ ...local, text: e.target.value })} rows={3} />
          </div>
          <div>
            <div className="text-xs">Bild (upload)</div>
            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageFile(e.target.files[0])} />
            {local.image && <div className="mt-2 text-xs">Vorschau:</div>}
            {local.image && <img src={local.image} alt="preview" className="max-h-28 mt-1 border border-green-800 rounded" />}
          </div>
          <div>
            <div className="text-xs">YouTube URL</div>
            <input className="w-full bg-black/60 border border-green-800 rounded p-2 font-mono text-green-200" value={local.video} onChange={(e) => setLocal({ ...local, video: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateUser(local)} className="px-3 py-1 rounded border border-green-700">Speichern</button>
            <button onClick={() => setLocal(user)} className="px-3 py-1 rounded border border-green-700">Abbrechen</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans">
      <MatrixBg />
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-center">
            {!currentUser && (
              <LoginCard />
            )}
            {currentUser && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-green-200 font-mono">Eingeloggt als <strong>{currentUser.displayName}</strong></div>
                  <div className="flex gap-2">
                    <button onClick={logout} className="px-3 py-1 rounded border border-green-700">Logout</button>
                    <label className="px-3 py-1 rounded border border-green-700 cursor-pointer">
                      <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && handleLoadUsersFile(e.target.files[0])} />
                      Load users
                    </label>
                    <button onClick={handleDownloadUsers} className="px-3 py-1 rounded border border-green-700">Export</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Show either admin panel or just user's public view */}
                  {currentUser.role === "admin" && <AdminPanel />}

                  <div>
                    <h4 className="text-lg font-mono text-green-200 mb-2">Öffentliche Ansicht</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.filter(u => u.id !== 'void').map(u => <UserPanel key={u.id} user={u} editable={false} />)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-l border-green-900 hidden md:block rounded-lg">
            <div className="text-green-300 font-mono text-xl mb-3">Matrix Stream</div>
            <div className="h-full overflow-auto space-y-4">
              <div className="bg-black/50 border border-green-800 rounded p-4 font-mono text-green-200">
                Tip: Als Admin (Void) kannst du Nutzer laden, editieren, Bilder hochladen und YouTube-Links einfügen.
              </div>

              <div className="bg-black/50 border border-green-800 rounded p-4 font-mono text-green-200">
                Paste a users.json file to replace or append users. Use the export button to download the current file.
              </div>

              <div className="bg-black/60 border border-green-800 rounded p-4 font-mono text-green-200">
                Customize the look in code: change fonts, animation speed, neon colors.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* small footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-green-400 font-mono opacity-80">matrix-hacker-ui — demo</div>
    </div>
  );
}
