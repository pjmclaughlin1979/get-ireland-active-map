import { useEffect, useState } from "react";

const clientId = import.meta.env.VITE_ARCGIS_CLIENT_ID;
const portalUrl = (import.meta.env.VITE_ARCGIS_PORTAL_URL || "https://esriireland.maps.arcgis.com").replace(/\/$/, "");
let authentication;
function loadAuthentication() {
  if (!authentication) authentication = (async () => {
    await customElements.whenDefined("arcgis-map");
    const [OAuthInfo, identityManager, Portal] = await Promise.all([
      "@arcgis/core/identity/OAuthInfo.js",
      "@arcgis/core/identity/IdentityManager.js",
      "@arcgis/core/portal/Portal.js",
    ].map(path => window.$arcgis.import(path)));
    identityManager.registerOAuthInfos([new OAuthInfo({
      appId:clientId, portalUrl, popup:false, flowType:"authorization-code",
    })]);
    return { identityManager, Portal };
  })().catch(error => { authentication = null; throw error; });
  return authentication;
}

export default function ArcGISAuth({ children }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(Boolean(clientId));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!clientId) return;
    let disposed = false;
    let timer;
    (async () => {
      try {
        const { identityManager, Portal } = await loadAuthentication();
        let credential;
        try { credential = await identityManager.checkSignInStatus(`${portalUrl}/sharing`); }
        catch { return; }
        const portal = new Portal({ url:portalUrl, authMode:"immediate" });
        await portal.load();
        if (!portal.user) throw new Error("No ArcGIS user was returned.");
        if (disposed) return;
        setUser({ username:portal.user.username, name:portal.user.fullName || portal.user.username });
        // Unmount the map when the SDK no longer has a valid credential.
        timer = window.setInterval(() => {
          const current = identityManager.findCredential(`${portalUrl}/sharing`, credential.userId);
          if (!current || current.expires <= Date.now()) {
            setUser(null);
            setError("Your session has ended. Sign in again to continue.");
          }
        }, 1000);
      } catch {
        if (!disposed) setError("We couldn't verify your ArcGIS session. Please try signing in again.");
      } finally { if (!disposed) setBusy(false); }
    })();
    return () => { disposed = true; window.clearInterval(timer); };
  }, []);
  const signIn = async () => {
    setBusy(true); setError("");
    try {
      const { identityManager } = await loadAuthentication();
      await identityManager.getCredential(`${portalUrl}/sharing`, { oAuthPopupConfirmation:false });
      window.location.reload();
    } catch { setBusy(false); setError("Sign-in wasn't completed. Please try again."); }
  };
  const signOut = async () => {
    setUser(null);
    const { identityManager } = await loadAuthentication();
    identityManager.destroyCredentials();
    window.location.reload();
  };
  if (user) return <>
    <div className="account-bar"><span>Signed in as <strong>{user.name}</strong> <span>({user.username})</span></span><button onClick={signOut}>Sign out</button></div>
    {children}
  </>;
  return <div className="auth-page"><main className="auth-card">
    <div className="auth-brand">Get Ireland Active</div>
    <h1>Sign in to explore</h1>
    <p>Use your ArcGIS Online account to access this site.</p>
    {!clientId ? <p role="status">ArcGIS sign-in is awaiting configuration. Contact the site administrator.</p> :
      <button onClick={signIn} disabled={busy}>{busy ? "Checking sign-in…" : "Sign in with ArcGIS Online"}</button>}
    {error && <p role="alert">{error}</p>}
  </main></div>;
}
