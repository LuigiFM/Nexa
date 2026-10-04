const accountDetails = document.querySelector("#account-details");
const loadingMessage = document.querySelector("#loading-message");
const apiResponse = document.querySelector("#api-response");
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

const studyConfig = {
  quickActions: {
    tutor: "Me ajude a estudar {subject}. Explique o conteúdo de forma didática e proponha um próximo passo.",
    resumo: "Faça um resumo claro dos principais conceitos de {subject}, com exemplos práticos.",
    quiz: "Crie um quiz de 5 perguntas sobre {subject}. Faça uma pergunta por vez e explique minhas respostas.",
    flashcards: "Crie flashcards para revisar os conceitos mais importantes de {subject}."
  }
};

function showNotice(message) {
  notice.textContent = message;
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
    document.querySelector("#account-id").textContent = user.id;
    document.querySelector("#welcome-title").textContent = `Olá, ${user.username}!`;
    document.querySelector("#avatar-username").textContent = user.username;
    document.querySelector("#avatar-initial").textContent = user.username.charAt(0).toUpperCase();
    apiResponse.textContent = JSON.stringify(user, null, 2);

    loadingMessage.hidden = true;
    accountDetails.hidden = false;
  } catch (error) {
    if (error.status === 401 || error.status === 404) {
      window.location.replace("./index.html");
      return;
    }

    loadingMessage.textContent = "Não foi possível carregar as informações da conta.";
    apiResponse.textContent = error.message;
    showNotice(error.message);
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
