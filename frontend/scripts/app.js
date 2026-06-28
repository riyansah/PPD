async function loadServerTime() {
  const target = document.querySelector("[data-server-time]");

  if (!target) {
    return;
  }

  try {
    const response = await fetch("/api/system/time");
    const payload = await response.json();
    const meta = payload.meta || {};

    target.textContent = `${meta.local_date || "--"} ${meta.local_time || "--"} WIB`;
  } catch (error) {
    target.textContent = "Server time unavailable";
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

loadServerTime();
setupMobileMenu();
