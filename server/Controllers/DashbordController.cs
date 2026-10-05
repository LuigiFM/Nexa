using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Nexa.Server.DatabaseContext;
using Nexa.Server.Models;
using Nexa.Server.Services;
using System.Text.Json.Nodes;
using Newtonsoft.Json.Linq;

namespace server.Controllers
{
    [ApiController]
    [Route("dashboard")]
    public class DashbordController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly LangFlowService _langFlowService;
        public DashbordController(AppDbContext dbContext, LangFlowService langFlowService)
        {
            _dbContext = dbContext;
            _langFlowService = langFlowService;
        }
        [HttpPost("question")]
        public async Task<IActionResult> Question([FromBody] StudyMessage studyMessage)
        {
    

            if(!Guid.TryParse(HttpContext.Session.GetString("UserId"), out Guid userguid))
            {
                return Unauthorized();
            }
            
            User? user = _dbContext.Users.FirstOrDefault<User>(u => u.Id == userguid);

            if(user == null)
            {
                return Unauthorized();
            }


            string username = user.Username;
            
            string message = $"Você é um tutor de estudos do Nexa. Usuário: {username}\nMatéria: {studyMessage.Context.Subject}\nTarefa atual: {studyMessage.Context.CurrentTask}\nPergunta: {studyMessage.Message}";


            string answer = await _langFlowService.SendMessageAsync(message);
            
            return Ok(answer);
        }
    }
}