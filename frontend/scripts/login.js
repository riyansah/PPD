function setMessage(target, message, state = "") {
  target.textContent = message;
  target.className = `form-message${state ? ` is-${state}` : ""}`;
}

async function submitLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector("[data-submit-button]");
  const message = form.querySelector("[data-form-message]");
  const formData = new FormData(form);
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");

  if (!login || !password) {
    setMessage(message, "Username/email and password are required.", "error");
    return;
  }

  submitButton.disabled = true;
  setMessage(message, "Signing in…");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ login, password })
    });
    const payload = await response.json();

    if (response.ok) {
      setMessage(message, "Login successful.", "success");
      window.location.href = "/";
      return;
    }

    if (response.status === 429) {
      setMessage(message, "Too many login attempts. Please wait and try again.", "error");
      return;
    }

    const error = (payload.errors || [])[0];
    setMessage(message, error ? error.message : "Unable to sign in.", "error");
  } catch (error) {
    setMessage(message, "Unable to sign in right now.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

document.querySelector("[data-login-form]")?.addEventListener("submit", submitLogin);
