/* If Supabase returns a Google sign-in to the static GitHub Pages prototype (its Site URL),
   forward the token to the real app instead of leaving the student on main.html. */
(function () {
  var APP = "https://lexy.ghostlynex.fun";
  var hash = window.location.hash || "";
  if (hash.indexOf("access_token=") < 0 && hash.indexOf("error_description=") < 0) return;
  if (window.location.hostname === "lexy.ghostlynex.fun") return;
  window.location.replace(APP + "/auth/callback?next=" + encodeURIComponent("/app") + hash);
})();
