using System.Text.Json.Nodes;
using Newtonsoft.Json.Linq;

namespace Nexa.Server.Methods
{
    public class LangFlowService
    {
        private readonly HttpClient _httpClient;
        public LangFlowService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        async public Task<string> SendMessageAsync(string msg)
        {
            string? _apiKey = Environment.GetEnvironmentVariable("LANGFLOW-API-KEY");

            if(String.IsNullOrEmpty(_apiKey))
            {
                return "";
            }


            string url = "http://localhost:7860/api/v1/run/5467023e-20cd-4394-ab06-7cf4641757dc";

            var requestPayload = new
            {
                input_value = msg,
                input_type = "chat",
                output_type = "chat"
            };

            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                url
            );

            request.Headers.Add("x-api-key", _apiKey);
            request.Content = JsonContent.Create(requestPayload);

            var response = await _httpClient.SendAsync(request);

            string content = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(content))
            {
                return "";
            }


            JObject json = JObject.Parse(content);
            
        
            string message = json["outputs"]?[0]?["outputs"]?[0]?["results"]?["message"]?["text"]?.ToString() ?? "";

            return message;
        }
    } 
}