import copy
import http.cookiejar
import json
import secrets
import sys
import uuid
import urllib.error
import urllib.request
from collections import Counter
from urllib.parse import urlparse

# Uso:
# py teste_seguranca_nexa.py
# py teste_seguranca_nexa.py http://localhost:5073
# py teste_seguranca_nexa.py --testar-ia
#
# --testar-ia faz UMA chamada anônima à IA.
# Se a rota estiver aberta, essa chamada poderá consumir sua API.

argumentos = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = (argumentos[0] if argumentos else "http://localhost:5073").rstrip("/")
TESTAR_IA = "--testar-ia" in sys.argv

if urlparse(BASE).hostname not in ("localhost", "127.0.0.1", "::1"):
    sys.exit("Este script aceita somente sua aplicação local.")

resultados = []


class SemRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Cliente:
    def __init__(self):
        self.cookies = http.cookiejar.CookieJar()
        self.http = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(self.cookies),
            SemRedirect(),
        )

    def req(self, method, path, body=None, headers=None, raw=None):
        h = dict(headers or {})
        data = raw

        if body is not None:
            data = json.dumps(body).encode()

        if data is not None:
            h["Content-Type"] = "application/json"

        request = urllib.request.Request(
            BASE + path, data=data, headers=h, method=method
        )

        try:
            response = self.http.open(request, timeout=20)
        except urllib.error.HTTPError as error:
            response = error

        with response:
            text = response.read().decode("utf-8", errors="replace")
            try:
                value = json.loads(text)
            except ValueError:
                value = text
            return response.status, response.headers, value

    def copiar(self):
        clone = Cliente()
        for cookie in self.cookies:
            clone.cookies.set_cookie(copy.copy(cookie))
        return clone


def registrar(estado, nome, detalhe=""):
    resultados.append(estado)
    print(f"[{estado}] {nome}")
    if detalhe:
        print("   " + detalhe)


def verificar(nome, condicao, detalhe=""):
    registrar("PASSOU" if condicao else "FALHOU", nome,
              "" if condicao else detalhe)


def negado(r):
    return r[0] in (401, 403)


def proteger(nome, r):
    if negado(r):
        registrar("PASSOU", nome)
    elif 200 <= r[0] < 300:
        registrar("FALHOU", nome, f"Acesso permitido: HTTP {r[0]}.")
    else:
        registrar("INCONCLUSIVO", nome, f"HTTP {r[0]}.")


def mesma_conta(r, uid):
    return (
        r[0] == 200
        and isinstance(r[2], dict)
        and r[2].get("id") == uid
    )


def sem_segredos(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key.lower() in (
                "password", "passwordhash", "securitystamp"
            ) and item:
                return False
            if not sem_segredos(item):
                return False
    elif isinstance(value, list):
        return all(sem_segredos(item) for item in value)
    return True


def nova_conta():
    nome = "seg_" + secrets.token_hex(6)
    return {
        "username": nome,
        "email": nome + "@example.invalid",
        "password": "Teste!9aA_" + secrets.token_hex(16),
    }


def login(c, dados):
    r = c.req("POST", "/Users/login", dados)
    me = c.req("GET", "/Users/me")

    if (
        not 200 <= r[0] < 300
        or me[0] != 200
        or not isinstance(me[2], dict)
        or me[2].get("username") != dados["username"]
        or not me[2].get("id")
    ):
        raise RuntimeError(
            f"Falha ao preparar login: login HTTP {r[0]}, "
            f"perfil HTTP {me[0]}."
        )
    return me[2]


def executar():
    anonimo = Cliente()
    proteger("Perfil exige login", anonimo.req("GET", "/Users/me"))

    # Duas contas independentes; uma envia um ID escolhido.
    contas = []
    id_enviado = str(uuid.uuid4())

    for numero in range(2):
        dados = nova_conta()
        c = Cliente()
        payload = dict(dados)

        if numero == 0:
            payload["id"] = id_enviado

        r = c.req("POST", "/Users/register", payload)

        if numero == 0 and r[0] in (400, 422):
            registrar(
                "INCONCLUSIVO", "Cadastro com ID fornecido",
                "Rejeitado. Confira se a causa foi o campo Id."
            )
            r = c.req("POST", "/Users/register", dados)
            enviou_id = False
        else:
            enviou_id = numero == 0

        if not 200 <= r[0] < 300:
            raise RuntimeError(f"Cadastro de teste: HTTP {r[0]}.")

        perfil = login(c, dados)
        contas.append((c, dados, perfil["id"]))

        if enviou_id:
            try:
                uid = uuid.UUID(str(perfil["id"]))
            except ValueError:
                raise RuntimeError("Perfil retornou ID que não é UUID.")

            verificar(
                "Cadastro ignora o ID escolhido pelo cliente",
                uid != uuid.UUID(id_enviado) and uid.int != 0,
                "O ID enviado foi aceito ou o ID retornado está vazio."
            )

    a, dados_a, id_a = contas[0]
    b, dados_b, id_b = contas[1]

    if id_a == id_b:
        raise RuntimeError("As duas contas receberam o mesmo ID.")

    verificar(
        "Sessões mantêm identidades independentes",
        mesma_conta(a.req("GET", "/Users/me"), id_a)
        and mesma_conta(b.req("GET", "/Users/me"), id_b)
    )

    r = a.req("GET", "/Users/me")
    if mesma_conta(r, id_a):
        verificar("Perfil não expõe senha/hash", sem_segredos(r[2]))
    else:
        registrar("INCONCLUSIVO", "Exposição de senha no perfil")

    for c, nome in ((anonimo, "anônimo"), (a, "usuário comum")):
        r = c.req("GET", "/Users")
        proteger("Lista de usuários bloqueada para " + nome, r)
        if r[0] == 200:
            verificar(
                "Lista não expõe senha/hash para " + nome,
                sem_segredos(r[2])
            )

    # Identidade não deve vir de parâmetros ou cookies inventados.
    r = Cliente().req(
        "GET", "/Users/me",
        headers={"Cookie": f"UserId={id_b}"}
    )
    proteger("Cookie UserId inventado não autentica", r)

    r = a.req(
        "GET", f"/Users/me?UserId={id_b}",
        headers={"X-User-Id": id_b}
    )
    verificar("ID externo não troca a conta", mesma_conta(r, id_a))

    # Cookie padrão do projeto.
    sessions = [
        c for c in a.cookies if c.name == ".AspNetCore.Session"
    ]
    if sessions:
        cookie = sessions[0]
        atributos = {k.lower(): v for k, v in cookie._rest.items()}

        verificar("Cookie usa HttpOnly", "httponly" in atributos)

        if cookie.secure:
            registrar("PASSOU", "Cookie usa Secure")
        else:
            registrar(
                "ALERTA", "Cookie sem Secure",
                "Em produção com HTTPS, configure SecurePolicy.Always."
            )

        same_site = str(atributos.get("samesite", "")).lower()
        if same_site in ("lax", "strict"):
            registrar(
                "PASSOU", "Cookie declara SameSite " + same_site,
                "Isso sozinho não comprova proteção completa contra CSRF."
            )
        else:
            registrar(
                "ALERTA", "Revisar SameSite",
                f"Valor: {same_site or 'ausente'}. "
                "Avalie junto com a proteção CSRF."
            )

        valor = cookie.value
        pos = len(valor) // 2
        alterado = (
            valor[:pos]
            + ("A" if valor[pos] != "A" else "B")
            + valor[pos + 1:]
        )
        r = Cliente().req(
            "GET", "/Users/me",
            headers={"Cookie": f"{cookie.name}={alterado}"}
        )
        proteger("Cookie adulterado não autentica", r)
    else:
        registrar(
            "INCONCLUSIVO", "Atributos e adulteração do cookie",
            "Cookie .AspNetCore.Session não encontrado."
        )

    # CORS: somente leitura da resposta; não é teste completo de CSRF.
    origem = "https://nao-autorizada.invalid"
    r = a.req("GET", "/Users/me", headers={"Origin": origem})

    if mesma_conta(r, id_a):
        verificar(
            "CORS não libera origem desconhecida",
            r[1].get("Access-Control-Allow-Origin") not in (origem, "*")
        )
    else:
        registrar("INCONCLUSIVO", "CORS", f"HTTP {r[0]}.")

    # Logout e reativação de cópia antiga.
    copia = a.copiar()
    if not mesma_conta(copia.req("GET", "/Users/me"), id_a):
        raise RuntimeError("Não foi possível preparar cópia da sessão.")

    r = a.req("DELETE", "/Users/logout")
    verificar("Logout retorna sucesso", 200 <= r[0] < 300)

    proteger("Sessão perde acesso após logout", a.req("GET", "/Users/me"))
    antes = copia.req("GET", "/Users/me")
    proteger("Cookie copiado perde acesso após logout", antes)

    verificar(
        "Logout de A preserva sessão de B",
        mesma_conta(b.req("GET", "/Users/me"), id_b)
    )

    login(a, dados_a)
    depois = copia.req("GET", "/Users/me")

    if negado(antes):
        proteger("Cookie antigo não recupera acesso no novo login", depois)
    else:
        registrar(
            "INCONCLUSIVO", "Reativação após novo login",
            "A cópia já não havia sido invalidada no logout."
        )

    a.req("DELETE", "/Users/logout")
    b.req("DELETE", "/Users/logout")

    # Entradas inválidas, sem bombardear o servidor.
    casos = [
        ("JSON quebrado", b'{"username":'),
        ("Corpo null", b"null"),
        ("Objeto vazio", b"{}"),
        ("Tipos incorretos", b'{"username":[],"password":{}}'),
        ("Senha null", json.dumps({
            "username": dados_a["username"], "password": None
        }).encode()),
    ]

    for nome, raw in casos:
        c = Cliente()
        r = c.req("POST", "/Users/login", raw=raw)
        me = c.req("GET", "/Users/me")

        if r[0] >= 500 or 200 <= r[0] < 300 or me[0] == 200:
            registrar(
                "FALHOU", "Entrada inválida: " + nome,
                f"Login HTTP {r[0]}; perfil HTTP {me[0]}."
            )
        elif r[0] in (400, 401, 403, 404, 415, 422) and negado(me):
            registrar("PASSOU", "Entrada inválida: " + nome)
        else:
            registrar(
                "INCONCLUSIVO", "Entrada inválida: " + nome,
                f"Login HTTP {r[0]}; perfil HTTP {me[0]}."
            )

    errada = dict(dados_a, password="Errada!" + secrets.token_hex(16))
    c = Cliente()
    r1 = c.req("POST", "/Users/login", errada)
    me = c.req("GET", "/Users/me")

    if r1[0] in (400, 401, 403) and negado(me):
        registrar("PASSOU", "Senha errada não autentica")
    elif 200 <= r1[0] < 300 or me[0] == 200:
        registrar("FALHOU", "Senha errada aceita")
    else:
        registrar("INCONCLUSIVO", "Senha errada", f"HTTP {r1[0]}.")

    inexistente = dict(
        errada, username="ausente_" + secrets.token_hex(16)
    )
    r2 = Cliente().req("POST", "/Users/login", inexistente)

    if all(r[0] in (400, 401, 403, 404) for r in (r1, r2)):
        if (r1[0], r1[2]) != (r2[0], r2[2]):
            registrar(
                "ALERTA", "Possível enumeração de usuários",
                "Conta existente e inexistente recebem respostas diferentes. "
                "Confira se a diferença indica a existência da conta."
            )
        else:
            registrar(
                "PASSOU", "Respostas de login iguais nesta comparação",
                "Tempo de resposta não foi analisado."
            )
    else:
        registrar("INCONCLUSIVO", "Enumeração de usuários")

    # Política de senha.
    fraca = dict(nova_conta(), password="a")
    r = Cliente().req("POST", "/Users/register", fraca)

    if 200 <= r[0] < 300:
        registrar("ALERTA", "Cadastro aceita senha de um caractere")
    elif r[0] in (400, 422):
        registrar(
            "PASSOU", "Cadastro com senha curta rejeitado",
            "Confira se o motivo retornado foi a política de senha."
        )
    elif r[0] >= 500:
        registrar("FALHOU", "Senha curta provoca erro interno")
    else:
        registrar("INCONCLUSIVO", "Política de senha", f"HTTP {r[0]}.")

    # Opcional: pode consumir API se o acesso estiver aberto.
    if TESTAR_IA:
        r = Cliente().req(
            "POST", "/AI/send-message",
            {"input_value": "Responda somente: OK"}
        )
        proteger("Rota AI exige autenticação", r)
    else:
        registrar(
            "NÃO TESTADO", "Autenticação de /AI/send-message",
            "Use --testar-ia para fazer uma chamada anônima."
        )

    # Pequena amostra, sem afirmar ausência de proteção se não houver 429.
    codigos = []
    c = Cliente()
    for _ in range(8):
        r = c.req("POST", "/Users/login", errada)
        codigos.append(r[0])
        if r[0] == 429 or r[0] >= 500:
            break

    if 429 in codigos:
        registrar("PASSOU", "Limitação HTTP 429 observada")
    else:
        registrar(
            "INCONCLUSIVO", "Limitação de tentativas",
            f"HTTP recebidos: {codigos}. "
            "Pode existir limite maior ou outro mecanismo."
        )


try:
    executar()
except Exception as error:
    registrar("INCONCLUSIVO", "Execução interrompida", str(error))

for nome in (
    "XSS no frontend",
    "CSRF em navegador",
    "Fixação de sessão antes do primeiro login",
    "Injeção em banco e segurança da integração com IA",
    "Dependências vulneráveis e segredos no repositório",
):
    registrar("NÃO TESTADO", nome)

print("\nRESUMO")
for estado, quantidade in Counter(resultados).items():
    print(f"{estado}: {quantidade}")

print("\nAs contas de teste permanecem no banco.")
print("PASSOU se refere somente ao caso executado, não ao sistema inteiro.")
print("ALERTA exige análise; INCONCLUSIVO não comprova proteção.")

sys.exit(
    1 if "FALHOU" in resultados
    else 2 if any(x in resultados for x in ("ALERTA", "INCONCLUSIVO"))
    else 0
)