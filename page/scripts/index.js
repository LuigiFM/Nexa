const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const tabList = document.querySelector(".tab-list");
const tabs = [...document.querySelectorAll(".tab-button")];
const notice = document.querySelector("#form-notice");
const title = document.querySelector("#form-title");
const subtitle = document.querySelector("#form-subtitle");
const formKicker = document.querySelector(".form-kicker");

function setNotice(message, type = "info") {
  notice.textContent = message;
  notice.dataset.type = type;
  notice.hidden = !message;
}

function setMode(mode, { clearNotice = true } = {}) {
  const isRegister = mode === "register";

  loginForm.hidden = isRegister;
  registerForm.hidden = !isRegister;
  tabList.dataset.active = mode;
  tabs.forEach((tab) => {
    const isSelected = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });

  title.textContent = isRegister ? "Crie sua conta" : "Acesse sua conta";
  subtitle.textContent = isRegister
    ? "Preencha seus dados para começar. É rápido e simples."
    : "Que bom ter você por aqui. Entre para continuar.";
  formKicker.textContent = isRegister ? "COMECE POR AQUI" : "BEM-VINDO(A) DE VOLTA";

  if (clearNotice) {
    setNotice("");
  }
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setFormBusy(form, busy, idleLabel) {
  const button = form.querySelector(".submit-button");
  button.disabled = busy;
  button.querySelector("span").textContent = busy ? "Aguarde..." : idleLabel;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

tabList.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();
  const currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
  const nextIndex = (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex].focus();
  setMode(tabs[nextIndex].dataset.mode);
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-pressed", String(showPassword));
    button.setAttribute("aria-label", showPassword ? "Ocultar senha" : "Mostrar senha");
  });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!registerForm.reportValidity()) {
    return;
  }

  setNotice("");
  setFormBusy(registerForm, true, "Criar minha conta");
  try {
    await window.authApi.request("register", {
      method: "POST",
      body: JSON.stringify(getFormValues(registerForm)),
    });
    registerForm.reset();
    setMode("login", { clearNotice: false });
    setNotice("Sua conta foi criada! Agora entre com seu nome de usuário e senha.", "success");
    document.querySelector("#login-username").focus();
  } catch (error) {
    setNotice(error.message, "error");
  } finally {
    setFormBusy(registerForm, false, "Criar minha conta");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) {
    return;
  }

  setNotice("");
  setFormBusy(loginForm, true, "Entrar na minha conta");
  try {
    const values = getFormValues(loginForm);
    await window.authApi.request("login", {
      method: "POST",
      body: JSON.stringify(values),
    });
    window.location.replace("./dashboard.html");
  } catch (error) {
    setNotice(error.message, "error");
  } finally {
    setFormBusy(loginForm, false, "Entrar na minha conta");
  }
});

async function restoreSession() {
  try {
    await window.authApi.request("me");
    window.location.replace("./dashboard.html");
  } catch (error) {
    if (error.status !== 401 && error.status !== 404) {
      setNotice(error.message, "error");
    }
  }
}

restoreSession();