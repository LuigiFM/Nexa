using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Nexa.Server.Models
{
    public class StudyMessage
    {

        [Required(AllowEmptyStrings = false, ErrorMessage = "O campo não pode ser vazio")]

        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("context")]
        public StudyContext Context { get; set; } = new (); 

         
    }


    //Opcional
    public class StudyContext
    {
        public string Subject { get; set; } = string.Empty;
        public string CurrentTask { get; set; } = string.Empty;
    }
}