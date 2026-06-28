function setMessage(target, message, state = "") {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = `form-message${state ? ` is-${state}` : ""}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  return { response, payload };
}

async function loadSession() {
  const displayName = document.querySelector("[data-display-name]");
  const userSummary = document.querySelector("[data-user-summary]");
  const sessionSummary = document.querySelector("[data-session-summary]");
  const accountDetails = document.querySelector("[data-account-details]");
  const serverTime = document.querySelector("[data-server-time]");

  try {
    const { response, payload } = await requestJson("/api/auth/session");
    if (!response.ok) {
      window.location.href = "/login";
      return;
    }

    const user = payload.data.user;
    const session = payload.data.session;
    const meta = payload.meta;

    displayName.textContent = user.display_name;
    userSummary.textContent = `${user.username} • ${user.email}`;
    sessionSummary.textContent = `Session active until ${session.expires_at} UTC. Idle timeout extends to ${session.idle_expires_at} UTC.`;
    accountDetails.textContent = `Display name: ${user.display_name}. Username: ${user.username}. Email: ${user.email}.`;
    serverTime.textContent = `${meta.local_date} ${meta.local_time} WIB`;
  } catch (error) {
    window.location.href = "/login";
  }
}

async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
  } finally {
    window.location.href = "/login";
  }
}

async function submitPasswordChange(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector("[data-password-submit]");
  const message = form.querySelector("[data-password-message]");
  const formData = new FormData(form);
  const body = {
    current_password: String(formData.get("current_password") || ""),
    new_password: String(formData.get("new_password") || ""),
    confirm_password: String(formData.get("confirm_password") || "")
  };

  submitButton.disabled = true;
  setMessage(message, "Updating password…");

  try {
    const { response, payload } = await requestJson("/api/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      form.reset();
      setMessage(message, "Password updated successfully.", "success");
      return;
    }

    const error = (payload.errors || [])[0];
    setMessage(message, error ? error.message : "Unable to update password.", "error");
  } catch (error) {
    setMessage(message, "Unable to update password right now.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

function setupMobileMenu() {
  const button = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("mobile-menu");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    menu.hidden = expanded;
  });
}

loadSession();
setupMobileMenu();

document.querySelector("[data-password-form]")?.addEventListener("submit", submitPasswordChange);
document.querySelectorAll("[data-logout-button]").forEach((button) => {
  button.addEventListener("click", logout);
});
