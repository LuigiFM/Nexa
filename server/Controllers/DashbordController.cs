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
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using server.Models;

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

        [HttpPost("register-study")]
        public async Task<IActionResult> RegisterTask([FromBody] StudyStatusForm form)
        {
            if (!Guid.TryParse(HttpContext.Session.GetString("UserId"), out Guid userguid))
            {
                return Unauthorized();
            }

            User? user = await _dbContext.Users
            .Include(u => u.studyStatus)
            .FirstOrDefaultAsync(u => u.Id == userguid);

            if (user == null)
            {
                return Unauthorized();
            }

            if (form.Materials != null)
            {
                foreach (StudyMaterialForm materialForm in form.Materials)
                {
                    StudyMaterial material = new()
                    {
                        Title = materialForm.Title,
                        Type = materialForm.Type
                    };

                    user.studyStatus.Materials.Add(material);
                    _dbContext.Entry(material).State = EntityState.Added;
                }
            }

            if (form.Tasks != null)
            {
                foreach (StudyTaskForm taskForm in form.Tasks)
                {
                    StudyTask task = new()
                    {
                        Title = taskForm.Title,
                        Subject = taskForm.Subject,
                        Status = taskForm.Status,
                        DurationMinutes = taskForm.DurationMinutes
                    };
                    user.studyStatus.Tasks.Add(task);
                    _dbContext.Entry(task).State = EntityState.Added;
                }
            }

            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("delete-study")]
        public async Task<IActionResult> DeleteStudy(Guid studyId)
        {
            if (!Guid.TryParse(HttpContext.Session.GetString("UserId"), out Guid userguid))
            {
                return Unauthorized();
            }

            User? user = await _dbContext.Users
            .Include(u => u.studyStatus)
            .FirstOrDefaultAsync(u => u.Id == userguid);

            if (user == null)
            {
                return Unauthorized();
            }

            StudyMaterial? material = user.studyStatus.Materials.FirstOrDefault(m => m.Id == studyId);
            if(material != null)
            {
                _dbContext.Remove(material);
            }

            StudyTask? task = user.studyStatus.Tasks.FirstOrDefault(t => t.Id == studyId);
            if(task != null)
            {
                _dbContext.Remove(task);
            }

            await _dbContext.SaveChangesAsync();
        
            return Ok();
        }

        [HttpPost("question")]
        public async Task<IActionResult> Question([FromBody] StudyMessage studyMessage)
        {


            if (!Guid.TryParse(HttpContext.Session.GetString("UserId"), out Guid userguid))
            {
                return Unauthorized();
            }

            User? user = _dbContext.Users.FirstOrDefault<User>(u => u.Id == userguid);

            if (user == null)
            {
                return Unauthorized();
            }


            string username = user.Username;

            string message = $"Você é um tutor de estudos do Nexa. Usuário: {username}\nMatéria: {studyMessage.Context.Subject}\nTarefa atual: {studyMessage.Context.CurrentTask}\nPergunta: {studyMessage.Message}";


            string answer = await _langFlowService.SendMessageAsync(message);

            return Ok(answer);
        }


        [HttpGet("overview")]
        public async Task<IActionResult> Overview()
        {
            if (!Guid.TryParse(HttpContext.Session.GetString("UserId"), out Guid userguid))
            {
                return Unauthorized();
            }


            User? user = await _dbContext.Users
                .Include(u => u.studyStatus)
                    .ThenInclude(status => status.Tasks)
                .Include(u => u.studyStatus)
                    .ThenInclude(status => status.Materials)
                .FirstOrDefaultAsync(u => u.Id == userguid);

            if (user == null) return Unauthorized();

            OverviewUser overviewUser = new()
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email
            };



            Overview overview = new()
            {
                User = overviewUser,
                Stats = new(),
                Tasks = new(),
                Materials = new()
            };

            foreach (StudyTask studyTask in user.studyStatus.Tasks)
            {
                OverviewTask overviewTask = new()
                {
                    Id = studyTask.Id,
                    Title = studyTask.Title,
                    DurationMinutes = studyTask.DurationMinutes,
                    Subject = studyTask.Subject,
                    Status = studyTask.Status
                };
                overview.Tasks.Add(overviewTask);
            }

            foreach (StudyMaterial studyMaterial in user.studyStatus.Materials)
            {
                OverviewMaterial overviewMaterial = new()
                {
                    Id = studyMaterial.Id,
                    Title = studyMaterial.Title,
                    Type = studyMaterial.Type
                };
                overview.Materials.Add(overviewMaterial);
            }


            //Consultar os dados e calcular estatísticas

            return Ok(overview);
        }
    }


}