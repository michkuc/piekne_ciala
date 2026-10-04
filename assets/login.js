(() => {
  const form = document.querySelector("#login-form");
  const input = document.querySelector("#site-pin");
  const error = document.querySelector("#pin-error");
  const button = form.querySelector('[type="submit"]');
  const requested = new URLSearchParams(location.search).get("next") || "/";
  const nextPath = requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") && !requested.startsWith("/login") ? requested : "/";
  input.focus();
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    error.textContent = "";
    try {
      const response = await fetch("/api/access", {method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({pin:input.value})});
      if (!response.ok) {
        error.textContent = response.status === 401 ? "Nieprawidłowy PIN. Spróbuj ponownie." : "Nie udało się sprawdzić PIN-u. Spróbuj ponownie.";
        input.select();
        return;
      }
      location.replace(nextPath);
    } catch { error.textContent = "Brak połączenia. Spróbuj ponownie."; }
    finally { button.disabled = false; }
  });
  document.querySelector("#leave-site").addEventListener("click", () => { location.replace("about:blank"); });
})();
