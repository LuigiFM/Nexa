using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Nexa.Server.Models;

namespace Nexa.Server.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum Status { Completed, Pending } 
    public class StudyStatusForm
    {
        public List<StudyTaskForm> Tasks { get; set; } = new();
        public List<StudyMaterialForm> Materials { get; set; } = new();
    }
    public class StudyStatus
    {
        [Key]
        [Required]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public User? User { get; set; }

        public int WeeklyGoalCompleted { get; set; }

        public int WeeklyGoalTotal { get; set; }

        public int StreakDays { get; set; }

        public DateTime LastLogin  { get; set; }

        //att
        public List<StudyTask> Tasks { get; set; } = new();

        //att
        public List<StudyMaterial> Materials { get; set; } = new();


    }

    public class StudyTask
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();  

        public string Title { get; set; } = string.Empty;

        public int DurationMinutes { get; set; } = 20;


        public string Subject { get; set; } = string.Empty;

        public Status Status { get; set; } = Status.Pending;
        public DateTime? CompletedDate { get; set; } = null;
    
        
    }

    public class StudyMaterial
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();


        public string Title { get; set; } = string.Empty;


        public string Type { get; set; } = string.Empty;
    }

    public class StudyTaskForm
    {
        public string Title { get; set; } = string.Empty;

        public int DurationMinutes { get; set; } = 20;


        public string Subject { get; set; } = string.Empty;


        public Status Status { get; set; }
    }

    public class StudyMaterialForm
    {

        public string Title { get; set; } = string.Empty;


        public string Type { get; set; } = string.Empty;
    }

    public class StatusUpdateForm
{
    public Guid TaskId { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Status status { get; set; }
}
}