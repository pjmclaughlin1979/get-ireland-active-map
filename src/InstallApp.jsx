import { useEffect, useState } from "react";

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    const available = event => {
      event.preventDefault();
      setPrompt(event);
    };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  if (!prompt) return null;
  return <button className="install-app" onClick={async () => {
    const current = prompt;
    setPrompt(null);
    try { await current.prompt(); } catch { /* Browser installation was dismissed or unavailable. */ }
  }}>Install app</button>;
}
