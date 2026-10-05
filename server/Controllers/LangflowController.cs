using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexa.Server.Models;
using Nexa.Server.DatabaseContext;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json.Linq;
using System.Text.Json.Nodes;
using System.Text.Json;
using Nexa.Server.Services;
using Microsoft.AspNetCore.Http.HttpResults;
namespace Nexa.Server.Controllers
{
    [ApiController]
    [Route("AI")]
    public class LangflowController : ControllerBase
    {
    private readonly AppDbContext _dbContext;
    private readonly LangFlowService _langFlowService;
    public LangflowController(AppDbContext dbContext, LangFlowService langFlowService)
    {
            _dbContext = dbContext;
            _langFlowService = langFlowService;
    }

    [HttpPost("send-message")]
    public async Task<IActionResult> SendMessage([FromBody] JsonObject? payload)
        {


            if (payload is null || !payload.TryGetPropertyValue("input_value", out var inputValue) || inputValue is null)
            {
                return BadRequest();
            }

            string? payloadMessage = inputValue.ToString();

            if (string.IsNullOrWhiteSpace(payloadMessage))
            {
                return BadRequest();
            }

            string message = await _langFlowService.SendMessageAsync(payloadMessage);

            if (string.IsNullOrEmpty(message))
            {
                return StatusCode(500);
            }

            return Ok(message);
        } 
    
    

    }
}