using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Nexa.Server.Models
{
    public class StudyMessage
    {
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("context")]
        public StudyContext Context { get; set; } = new (); 

         
    }

    public class StudyContext
    {
        public string Subject { get; set; } = string.Empty;
        public string CurrentTask { get; set; } = string.Empty;
    }
}