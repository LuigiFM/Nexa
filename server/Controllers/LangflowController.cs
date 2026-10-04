using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Nexa.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Text.Json.Nodes;

namespace Nexa.Server.Controllers
{
    [ApiController]
    [Route("AI")]
    public class LangflowController : ControllerBase
    {

    private readonly HttpClient _httpclient;
    private readonly string? _apiKey;
    public LangflowController(HttpClient httpClient)
    {
            _httpclient = httpClient;
            _apiKey = Environment.GetEnvironmentVariable("LANGFLOW-API-KEY");
    }

    [HttpPost("create")]
    public async Task<IActionResult> SendMessage([FromBody] JsonObject payload)
        {
            if(!payload.ContainsKey("input_value"))
            {
                return BadRequest();
            }

            string url = "http://localhost:7860/api/v1/run/5467023e-20cd-4394-ab06-7cf4641757dc";

            var requestPayload = new
            {
                input_value = payload["input_value"]?.ToString(),
                input_type = "chat",
                output_type = "chat"
            };



            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                url
            );

            request.Headers.Add("x-api-key", _apiKey);
            request.Content = JsonContent.Create(requestPayload);

            var response = await _httpclient.SendAsync(request);

            string content = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(content))
            {
                return StatusCode(500, "LangFlow respondeu nada.");
            }

            Console.WriteLine(content);


            JObject json = JObject.Parse(content);
            
        
            string message = json["outputs"]?[0]?["outputs"]?[0]?["results"]?["message"]?["text"]?.ToString() ?? "";

            if(!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, message);
            }

            
            return Ok(message);
        } 
    

    
    }
}