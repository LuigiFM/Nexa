const accountDetails = document.querySelector("#account-details");
const loadingMessage = document.querySelector("#loading-message");
const notice = document.querySelector("#dashboard-notice");
const logoutButton = document.querySelector("#logout-button");
const chatThread = document.querySelector("#chat-thread");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatSend = document.querySelector("#chat-send");
const contextSubject = document.querySelector("#context-subject");
const contextTask = document.querySelector("#context-task");
const tutorStatus = document.querySelector("#tutor-status");
const featureButtons = document.querySelectorAll("button[data-action]");
const studyPlan = document.querySelector("#study-plan");
const materialList = document.querySelector("#material-list");
const taskForm = document.querySelector("#task-form");
const materialForm = document.querySelector("#material-form");
const navigationLinks = [...document.querySelectorAll(".top-nav .nav-link")];

const studyConfig = {
  quickActions: {
    tutor: "Me ajude a estudar {subject}. Explique o conteúdo de forma didática e proponha um próximo passo.",
    resumo: "Faça um resumo claro dos principais conceitos de {subject}, com exemplos práticos.",
    quiz: "Crie um quiz de 5 perguntas sobre {subject}. Faça uma pergunta por vez e explique minhas respostas.",
    flashcards: "Crie flashcards para revisar os conceitos mais importantes de {subject}."
  }
};

function showNotice(message, type = "error") {
  notice.textContent = message;
  notice.dataset.type = type;
  notice.setAttribute("role", type === "success" ? "status" : "alert");
  notice.hidden = !message;
}

function addMessage(text, type = "bot") {
  const message = document.createElement("div");
  message.className = `message message-${type}`;
  message.textContent = text;
  chatThread.appendChild(message);
  chatThread.scrollTop = chatThread.scrollHeight;
  return message;
}

function renderTasks(tasks) {
  studyPlan.replaceChildren();
  document.querySelector("#task-count").textContent = `${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}`;
  document.querySelector("#progress-task-count").textContent = String(tasks.length);

  if (tasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "list-empty-state";
    emptyState.textContent = "Você ainda não cadastrou tarefas.";
    studyPlan.appendChild(emptyState);
    return;
  }

  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    item.className = "plan-item";

    const number = document.createElement("span");
    number.className = "plan-index";
    number.textContent = String(index + 1).padStart(2, "0");

    const copy = document.createElement("div");
    copy.className = "plan-copy";

    const title = document.createElement("strong");
    title.textContent = task.title || "Tarefa sem título";

    const details = document.createElement("span");
    const duration = Number.isFinite(Number(task.durationMinutes))
      ? `${task.durationMinutes} min`
      : "";
    details.textContent = [task.subject, duration].filter(Boolean).join(" · ") || "Sem detalhes";

    const status = document.createElement("span");
    const normalizedStatus = String(task.status || "").toLowerCase();
    const completed = normalizedStatus === "done" || normalizedStatus === "completed" || normalizedStatus === "concluído";
    const inProgress = normalizedStatus === "inprogress" || normalizedStatus === "in-progress" || normalizedStatus === "em andamento";
    status.className = `plan-state ${completed ? "done" : inProgress ? "pending" : "upcoming"}`;
    status.textContent = completed ? "Concluído" : inProgress ? "Em curso" : "Pendente";

    copy.append(title, details);
    item.append(number, copy, status);
    studyPlan.appendChild(item);
  });
}

function renderMaterials(materials) {
  materialList.replaceChildren();
  const countLabel = `${materials.length} ${materials.length === 1 ? "item" : "itens"}`;
  document.querySelector("#material-count").textContent = countLabel;
  document.querySelector("#progress-material-count").textContent = String(materials.length);

  if (materials.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "list-empty-state";
    emptyState.textContent = "Você ainda não cadastrou materiais.";
    materialList.appendChild(emptyState);
    return;
  }

  materials.forEach((material) => {
    const item = document.createElement("li");
    const bullet = document.createElement("span");
    bullet.className = "material-bullet";

    const copy = document.createElement("span");
    copy.className = "material-copy";

    const title = document.createElement("span");
    title.textContent = material.title || "Material sem título";
    copy.appendChild(title);

    if (material.type) {
      const type = document.createElement("small");
      type.textContent = material.type;
      copy.appendChild(type);
    }

    item.append(bullet, copy);
    materialList.appendChild(item);
  });
}

function renderOverview(overview) {
  renderTasks(Array.isArray(overview.tasks) ? overview.tasks : []);
  renderMaterials(Array.isArray(overview.materials) ? overview.materials : []);
}

function setActiveNavigation(targetId) {
  navigationLinks.forEach((link) => {
    const isActive = link.hash === `#${targetId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveNavigation(link.hash.slice(1)));
});

const navigationTargets = navigationLinks
  .map((link) => document.querySelector(link.hash))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visibleTargets = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => navigationTargets.indexOf(second.target) - navigationTargets.indexOf(first.target));
    if (visibleTargets.length > 0) {
      setActiveNavigation(visibleTargets[0].target.id);
    }
  }, { rootMargin: "-25% 0px -65% 0px" });

  navigationTargets.forEach((target) => navigationObserver.observe(target));
}

function showOverviewUnavailable() {
  studyPlan.replaceChildren();
  materialList.replaceChildren();

  const taskMessage = document.createElement("li");
  taskMessage.className = "list-empty-state";
  taskMessage.textContent = "Não foi possível carregar as tarefas.";
  studyPlan.appendChild(taskMessage);

  const materialMessage = document.createElement("li");
  materialMessage.className = "list-empty-state";
  materialMessage.textContent = "Não foi possível carregar os materiais.";
  materialList.appendChild(materialMessage);

  document.querySelector("#task-count").textContent = "— tarefas";
  document.querySelector("#material-count").textContent = "— itens";
  document.querySelector("#progress-task-count").textContent = "—";
  document.querySelector("#progress-material-count").textContent = "—";
}

function setFormBusy(form, busy, idleButtonText) {
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = busy;
  submitButton.textContent = busy ? "Salvando..." : idleButtonText;
}

async function registerStudyItem(form, item, idleButtonText) {
  setFormBusy(form, true, idleButtonText);
  showNotice("");

  try {
    await window.authApi.request("/dashboard/register-study", {
      method: "POST",
      body: JSON.stringify(item),
    });

    form.reset();
    const durationInput = form.querySelector("#task-duration");
    if (durationInput) {
      durationInput.value = "20";
    }

    const overview = await loadOverview();
    if (overview) {
      showNotice("Item adicionado com sucesso.", "success");
    }
  } catch (error) {
    showNotice(error.message);
    if (error.status === 401) {
      window.location.replace("./index.html");
    }
  } finally {
    setFormBusy(form, false, idleButtonText);
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!taskForm.reportValidity()) {
    return;
  }

  registerStudyItem(taskForm, {
    tasks: [{
      title: document.querySelector("#task-title").value.trim(),
      subject: document.querySelector("#task-subject").value.trim(),
      durationMinutes: Number(document.querySelector("#task-duration").value),
      status: "notdone",
    }],
    materials: [],
  }, "Adicionar tarefa");
});

materialForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!materialForm.reportValidity()) {
    return;
  }

  registerStudyItem(materialForm, {
    tasks: [],
    materials: [{
      title: document.querySelector("#material-title").value.trim(),
      type: document.querySelector("#material-type").value,
    }],
  }, "Adicionar material");
});

function setChatBusy(busy) {
  chatInput.disabled = busy;
  contextSubject.disabled = busy;
  contextTask.disabled = busy;
  chatSend.disabled = busy;
  featureButtons.forEach((button) => {
    button.disabled = busy;
  });
  if (busy) {
    tutorStatus.textContent = "respondendo...";
  } else if (tutorStatus.textContent === "respondendo...") {
    tutorStatus.textContent = "online";
  }
}

async function sendQuestion(text) {
  const prompt = text.trim();
  if (!prompt || chatSend.disabled) {
    return;
  }

  showNotice("");
  addMessage(prompt, "user");
  const pendingMessage = addMessage("Consultando o tutor...", "bot");
  chatInput.value = "";
  setChatBusy(true);

  try {
    const answer = await window.authApi.request("/dashboard/question", {
      method: "POST",
      body: JSON.stringify({
        message: prompt,
        context: {
          subject: contextSubject.value.trim(),
          currentTask: contextTask.value.trim(),
        },
      }),
    });

    const answerText = typeof answer === "string" ? answer.trim() : "";
    if (!answerText) {
      throw new Error("O tutor retornou uma resposta vazia. Confira a configuração do Langflow.");
    }

    pendingMessage.textContent = answerText;
  } catch (error) {
    pendingMessage.textContent = "Não consegui obter uma resposta do tutor.";
    tutorStatus.textContent = "indisponível";
    showNotice(error.message);
    if (error.status === 401) {
      window.location.replace("./index.html");
      return;
    }
  } finally {
    setChatBusy(false);
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendQuestion(chatInput.value);
});

featureButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    const subject = contextSubject.value.trim() || "a matéria que estou estudando";
    const prompt = studyConfig.quickActions[action]?.replaceAll("{subject}", subject);
    if (prompt) {
      sendQuestion(prompt);
    }
  });
});

async function loadAccount() {
  try {
    const user = await window.authApi.request("me");

    document.querySelector("#account-username").textContent = user.username;
    document.querySelector("#account-email").textContent = user.email;
    document.querySelector("#welcome-title").textContent = `Olá, ${user.username}!`;
    document.querySelector("#avatar-username").textContent = user.username;
    document.querySelector("#avatar-initial").textContent = user.username.charAt(0).toUpperCase();

    loadingMessage.hidden = true;
    accountDetails.hidden = false;

    await loadOverview();
  } catch (error) {
    if (error.status === 401 || error.status === 404) {
      window.location.replace("./index.html");
      return;
    }
    showOverviewUnavailable();
    loadingMessage.textContent = "Não foi possível carregar as informações da conta.";
    showNotice(error.message);
  }
}

async function loadOverview() {
  try {
    const overview = await window.authApi.request("/dashboard/overview");
    renderOverview(overview);
    return overview;
  } catch (error) {
    if (error.status === 401) {
      window.location.replace("./index.html");
      return null;
    }
    showOverviewUnavailable();
    showNotice(`Não foi possível carregar tarefas e materiais: ${error.message}`);
    return null;
  }
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  showNotice("");

  try {
    await window.authApi.request("logout", { method: "DELETE" });
    window.location.replace("./index.html");
  } catch (error) {
    showNotice(error.message);
    logoutButton.disabled = false;
  }
});

loadAccount();
