window.authApi = (() => {
  const baseUrl = (window.AUTH_API_BASE_URL ?? "http://127.0.0.1:5073").replace(/\/+$/, "");

  function getErrorMessage(body, status) {
    if (typeof body === "string" && body.trim()) {
      return body;
    }

    if (body && typeof body === "object") {
      if (typeof body.detail === "string") {
        return body.detail;
      }
      if (typeof body.message === "string") {
        return body.message;
      }

      if (body.errors && typeof body.errors === "object") {
        const firstError = Object.values(body.errors).flat().find(Boolean);
        if (typeof firstError === "string") {
          return firstError;
        }
      }

      if (typeof body.title === "string") {
        return body.title;
      }
    }

    if (status === 401 || status === 404) {
      return "Sua sessão não está ativa. Entre novamente para continuar.";
    }
    if (status === 409) {
      return "Esse nome de usuário ou e-mail já está cadastrado.";
    }
    return "Não foi possível concluir sua solicitação. Tente novamente.";
  }

  async function request(path, options = {}) {
    let response;
    const normalizedPath = path.startsWith("/")
      ? path
      : path.includes("/") || path.startsWith("Dashboard") || path.startsWith("AI")
        ? `/${path}`
        : `/Users/${path}`;

    try {
      response = await fetch(`${baseUrl}${normalizedPath}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } catch {
      throw new Error("Não foi possível conectar à API. Verifique se o servidor está iniciado.");
    }

    const responseText = await response.text();
    let body = responseText;
    if (responseText) {
      try {
        body = JSON.parse(responseText);
      } catch {
        body = responseText;
      }
    }

    if (!response.ok) {
      const error = new Error(getErrorMessage(body, response.status));
      error.status = response.status;
      throw error;
    }

    return body;
  }

  return { request };
})();
