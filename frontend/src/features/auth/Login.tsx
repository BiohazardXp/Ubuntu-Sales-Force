import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await axios.post("http://localhost:5000/login", {
      username,
      password,
    });

    localStorage.setItem("token", res.data.token);
    window.location.href = "/dashboard";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md border">
        
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Sales Force Login
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          Enter your credentials to continue
        </p>

        <input
          className="w-full border p-3 rounded-lg mb-3"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded-lg mb-4"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>
    </div>
  );
}