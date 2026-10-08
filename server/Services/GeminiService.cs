using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http.HttpResults;
using Newtonsoft.Json.Linq;

namespace Nexa.Server.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        public GeminiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        async public Task<string> SendMessageAsync(string msg)
        {
            string url = "https://generativelanguage.googleapis.com/v1beta/interactions";
            string? _apiKey = Environment.GetEnvironmentVariable("GEMINI-API-KEY");

            if(String.IsNullOrEmpty(_apiKey))
            {
                throw new InvalidOperationException("NO API KEY");
            }

            var requestPayload = new
            {
                model = "gemini-3.8-flash",
                input = msg
            };

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = JsonContent.Create(requestPayload);
            request.Headers.Add("x-goog-api-key", _apiKey);

            HttpResponseMessage response = await _httpClient.SendAsync(request);

            string content = await response.Content.ReadAsStringAsync();
            var json = JObject.Parse(content);

            string answer = json?["output_text"]?.ToString() ?? "";

            return answer;
        }


    }
}