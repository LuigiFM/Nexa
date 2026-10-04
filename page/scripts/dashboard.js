const accountDetails = document.querySelector("#account-details");
const loadingMessage = document.querySelector("#loading-message");
const apiResponse = document.querySelector("#api-response");
const notice = document.querySelector("#dashboard-notice");
const logoutButton = document.querySelector("#logout-button");

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = !message;
}

async function loadAccount() {
  try {
    const user = await window.authApi.request("me");

    document.querySelector("#account-username").textContent = user.username;
    document.querySelector("#account-email").textContent = user.email;
    document.querySelector("#account-id").textContent = user.id;
    document.querySelector("#welcome-title").textContent = `Olá, ${user.username}!`;
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
