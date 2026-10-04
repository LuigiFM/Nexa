<div align="center">

# ✦ Nexa

### Seu espaço de estudos, com inteligência artificial ao seu lado.

Uma plataforma em desenvolvimento para ajudar estudantes a organizar os estudos,
entender assuntos difíceis e aprender no próprio ritmo.

<p>
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-8b5cf6?style=for-the-badge" alt="Status: em desenvolvimento" />
  <img src="https://img.shields.io/badge/.NET-10-512bd4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10" />
  <img src="https://img.shields.io/badge/idioma-portugu%C3%AAs-2563eb?style=for-the-badge" alt="Idioma: português" />
</p>

</div>

---

## 💡 Sobre o projeto

O **Nexa** está sendo criado para reunir em um só lugar ferramentas que tornam a
rotina de estudos mais simples, personalizada e acessível. A proposta é combinar
uma experiência de aprendizagem organizada com recursos de IA que apoiem o aluno
sem substituir sua autonomia.

> **Projeto em fase inicial:** cadastro, login, sessão de usuário e uma primeira
> integração de API com Langflow já estão na base. As outras funcionalidades
> abaixo são ideias planejadas e ainda não estão disponíveis.

## ✨ O que já existe

- **Cadastro e login** com validação básica dos dados.
- **Sessão de usuário** e opção de sair da conta.
- **Dashboard inicial** com informações do perfil.
- **API em ASP.NET Core** para autenticação e comunicação com o front-end.
- **Conexão experimental com Langflow** preparada na API para enviar mensagens.

## 🧭 Ideias para o roadmap

Estas são funcionalidades que o Nexa pretende desenvolver. A ordem e o escopo
podem mudar conforme o projeto evoluir.

- [ ] **Tutor de estudos com IA** — conversar, tirar dúvidas e receber explicações
  adaptadas ao nível do aluno.
- [ ] **Resumos inteligentes** — transformar anotações e materiais em revisões
  mais objetivas.
- [ ] **Quizzes e exercícios** — praticar os conteúdos e receber explicações
  sobre as respostas.
- [ ] **Flashcards** — revisar conceitos com repetição espaçada.
- [ ] **Plano de estudos** — organizar matérias, metas e sessões de estudo.
- [ ] **Acompanhamento de progresso** — visualizar atividades concluídas e
  evolução por matéria.
- [ ] **Materiais de estudo** — reunir conteúdos e anotações em um espaço
  organizado.

## 🖥️ Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Front-end | HTML, CSS e JavaScript |
| Back-end | ASP.NET Core / C# |
| Dados | Entity Framework Core com banco em memória nesta etapa |
| IA | Integração experimental com Langflow |

## 📁 Estrutura

```text
Nexa/
├── page/                      # Páginas e arquivos do front-end
│   ├── index.html              # Cadastro e login
│   ├── dashboard.html          # Área inicial da conta
│   ├── scripts/                # Integração com a API e comportamento das páginas
│   └── style/                  # Estilos
├── server/                     # API ASP.NET Core
│   ├── Controllers/            # Rotas de usuários e integração com IA
│   ├── DatabaseContext/        # Contexto do Entity Framework Core
│   ├── Models/                 # Modelos da aplicação
│   ├── Nexa.Server.csproj
│   └── .env.example             # Exemplo de configuração local
└── Nexa.slnx                   # Solução .NET
```

## 🚀 Como executar

### Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Visual Studio Code](https://code.visualstudio.com/) com a extensão
  [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer),
  ou outro servidor estático configurado para `127.0.0.1:5500`.

### 1. Inicie a API

Na raiz do repositório:

```bash
dotnet run --project server/Nexa.Server.csproj
```

A API ficará disponível em `http://localhost:5073`.

### 2. Abra o front-end

Sirva a pasta `page` em `http://127.0.0.1:5500` e abra `index.html`. Com o Live
Server no VS Code, abra `page/index.html` e selecione **Open with Live Server**.

> A origem `http://127.0.0.1:5500` precisa ser mantida para corresponder à
> configuração de CORS atual da API.

### 3. Configure a integração com Langflow (opcional)

A rota de IA espera uma instância do Langflow em `http://localhost:7860` e uma
chave de API. Copie `server/.env.example` para `server/.env` e substitua o valor
de exemplo pela sua chave:

```env
LANGFLOW-API-KEY=sua-chave-local
```

Não compartilhe nem envie seu arquivo `.env` para o repositório. A conexão com
Langflow é experimental e, por enquanto, ainda não está integrada à interface.

## 🔌 API disponível

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/Users/register` | Cria uma conta |
| `POST` | `/Users/login` | Inicia uma sessão |
| `GET` | `/Users/me` | Retorna os dados da sessão atual |
| `DELETE` | `/Users/logout` | Encerra a sessão |
| `GET` | `/Users` | Lista as contas cadastradas |
| `POST` | `/AI/create` | Encaminha uma mensagem para o Langflow configurado |

## ⚠️ Observações

- Os dados de usuário são armazenados em um banco **em memória** e são perdidos
  quando a API é reiniciada. A persistência ainda está nos planos.
- A integração com Langflow depende de uma instância local disponível e de uma
  chave válida.
- O projeto está em desenvolvimento; funcionalidades, rotas e tecnologias podem
  mudar.

## 🤝 Contribuições

Sugestões, ideias e contribuições são bem-vindas! Abra uma *issue* para
compartilhar uma proposta ou relatar um problema.

---

<div align="center">
  Feito para apoiar cada passo da sua jornada de aprendizagem. ✨
</div>
