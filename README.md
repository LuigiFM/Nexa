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

> **Projeto em fase inicial:** cadastro, login e sessão de usuário estão
> implementados. O dashboard já pode enviar perguntas ao Langflow pelo backend.
> O overview com progresso real, tarefas persistidas e materiais ainda está
> planejado.

## ✨ O que já existe

- **Cadastro e login** com validação básica dos dados.
- **Sessão de usuário** e opção de sair da conta.
- **Dashboard inicial** com informações do perfil e interface de tutor.
- **API em ASP.NET Core** para autenticação e comunicação com o front-end.
- **Tutor com Langflow (experimental)**: o dashboard envia pergunta e contexto
  para a API, que encaminha a mensagem ao fluxo configurado.

## 🧭 Ideias para o roadmap

Estas são funcionalidades que o Nexa pretende desenvolver. A ordem e o escopo
podem mudar conforme o projeto evoluir.

- [x] **Tutor de estudos com IA (versão inicial)** — enviar perguntas pelo
  dashboard e receber respostas do Langflow. Histórico, personalização e
  tratamento completo de indisponibilidade ainda precisam evoluir.
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
| IA | Langflow (integração experimental) |

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

### 3. Configure a integração com Langflow (necessário para usar o tutor)

A rota de IA espera uma instância do Langflow em `http://localhost:7860` e uma
chave de API. Copie `server/.env.example` para `server/.env` e substitua o valor
de exemplo pela sua chave:

```env
LANGFLOW-API-KEY=sua-chave-local
```

Não compartilhe nem envie seu arquivo `.env` para o repositório. O tutor do
dashboard envia as perguntas para a API Nexa, que chama o Langflow no servidor.
A chave de API não deve ser colocada no HTML ou no JavaScript do navegador.

## 🔌 API disponível

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/Users/register` | Cria uma conta |
| `POST` | `/Users/login` | Inicia uma sessão |
| `GET` | `/Users/me` | Retorna os dados da sessão atual |
| `DELETE` | `/Users/logout` | Encerra a sessão |
| `GET` | `/Users` | Lista as contas cadastradas |
| `POST` | `/dashboard/question` | Envia a pergunta e o contexto do estudo ao tutor; requer sessão |
| `POST` | `/AI/send-message` | Encaminha `input_value` ao Langflow; endpoint de integração direta |

O endpoint `/dashboard/question` recebe um JSON neste formato:

```json
{
  "message": "Explique fotossíntese de forma simples",
  "context": {
    "subject": "Biologia",
    "currentTask": "Revisar capítulo 2"
  }
}
```

O endpoint `/AI/send-message` recebe `input_value` como texto. O
`LangFlowService` envia as mensagens para o fluxo configurado na API. As rotas
de IA dependem do Langflow estar acessível e da chave de API estar configurada.

## 📊 Próxima camada: overview do dashboard

O endpoint `GET /Dashboard/overview` ainda não está implementado. A proposta é
que ele exija a sessão atual e devolva um resumo calculado para o usuário
autenticado, sem aceitar um `userId` enviado pelo navegador. O contrato esperado
pelo front-end pode ter esta forma:

```json
{
  "user": {
    "id": "guid-do-usuario",
    "username": "Luigi",
    "email": "luigi@example.com"
  },
  "stats": {
    "focusTodayMinutes": 65,
    "weeklyGoalCompleted": 4,
    "weeklyGoalTotal": 7,
    "streakDays": 3,
    "progressPercent": 57
  },
  "tasks": [
    {
      "id": "guid-da-tarefa",
      "title": "Revisar fotossíntese",
      "durationMinutes": 25,
      "subject": "Biologia",
      "status": "pending"
    }
  ],
  "materials": [
    {
      "id": "guid-do-material",
      "title": "Resumo de biologia celular",
      "type": "notes"
    }
  ]
}
```

Para tornar esses valores reais, o backend precisa persistir sessões de estudo,
tarefas e materiais vinculados ao usuário. `focusTodayMinutes` deve somar os
minutos de sessões concluídas no dia; `weeklyGoalCompleted` deve contar as
sessões ou tarefas concluídas na semana, usando a mesma unidade da meta;
`weeklyGoalTotal` deve vir de uma meta definida para o usuário; `streakDays`
deve contar dias consecutivos com atividade concluída; e `progressPercent`
deve ser calculado a partir do progresso e da meta, limitando o resultado ao
intervalo de 0 a 100.

O controller do overview deve obter o usuário pela sessão, consultar apenas os
registros desse usuário, montar o DTO `Overview` e retornar listas vazias quando
ele ainda não tiver tarefas ou materiais. O front-end então deve preencher as
estatísticas, tarefas e materiais com essa resposta. Não há um modelo de
persistência de estudo conectado ao `AppDbContext` neste momento.

## ⚠️ Observações

- Os dados de usuário são armazenados em um banco **em memória** e são perdidos
  quando a API é reiniciada. A persistência ainda está nos planos.
- A integração experimental com Langflow depende de uma instância local
  disponível e de uma chave válida; erros e indisponibilidade ainda precisam de
  tratamento mais completo.
- O progresso do dashboard ainda não é calculado a partir de sessões, tarefas
  ou materiais persistidos.
- O projeto está em desenvolvimento; funcionalidades, rotas e tecnologias podem
  mudar.

## 🤝 Contribuições

Sugestões, ideias e contribuições são bem-vindas! Abra uma *issue* para
compartilhar uma proposta ou relatar um problema.

---

<div align="center">
  Feito para apoiar cada passo da sua jornada de aprendizagem. ✨
</div>
