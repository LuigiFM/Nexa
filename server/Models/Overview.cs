using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Nexa.Server.Models
{
    public class Overview
    {
        [JsonPropertyName("user")]
        public OverviewUser User { get; set; } = new();

        [JsonPropertyName("stats")]
        public OverviewStats Stats { get; set; } = new();

        [JsonPropertyName("tasks")]
        public List<OverviewTask> Tasks { get; set; } = new();

        [JsonPropertyName("materials")]
        public List<OverviewMaterial> Materials { get; set; } = new();
    }

    public class OverviewUser
    { 
        [JsonPropertyName("id")]
        public Guid Id { get; set; } 

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    public class OverviewStats
    {
        [JsonPropertyName("focusTodayMinutes")]
        public int FocusTodayMinutes { get; set; }

        [JsonPropertyName("weeklyGoalCompleted")]
        public int WeeklyGoalCompleted { get; set; }

        [JsonPropertyName("weeklyGoalTotal")]
        public int WeeklyGoalTotal { get; set; }

        [JsonPropertyName("streakDays")]
        public int StreakDays { get; set; }

        [JsonPropertyName("progressPercent")]
        public int ProgressPercent { get; set; }
    }

    public class OverviewTask
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("durationMinutes")]
        public int DurationMinutes { get; set; }

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "none";
    }

    public class OverviewMaterial
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
    }
}