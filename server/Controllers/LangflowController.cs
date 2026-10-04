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
using Nexa.Server.Methods;
using Microsoft.AspNetCore.Http.HttpResults;
namespace Nexa.Server.Controllers
{
    [ApiController]
    [Route("AI")]
    public class LangflowController : ControllerBase
    {

    private readonly HttpClient _httpclient;
    private readonly string? _apiKey;
    private readonly AppDbContext _dbContext;
    private readonly Methods.Methods _methods;
    public LangflowController(HttpClient httpClient, AppDbContext dbContext)
    {
            _httpclient = httpClient;
            _apiKey = Environment.GetEnvironmentVariable("LANGFLOW-API-KEY");
            _dbContext = dbContext;
            _methods = new Methods.Methods();
    }

    [HttpPost("send-message")]
    public async Task<IActionResult> SendMessage([FromBody] JsonObject payload)
        {
            if(!payload.ContainsKey("input_value"))
            {
                return BadRequest();
            }
           
           string? payloadMessage = payload["input_value"]?.ToString();

           if(String.IsNullOrEmpty(payloadMessage))
            {
                return BadRequest();
            }

           string message = await _methods.SendMessageAsync(payloadMessage);

            if(String.IsNullOrEmpty(message))
            {
                return StatusCode(500);
            }

            
            return Ok(message);
        } 
    
    

    }
}