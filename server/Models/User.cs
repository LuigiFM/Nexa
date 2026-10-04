using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Nexa.Server.Models
{
    public class User
    {
        [Key]
        [Required]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MinLength(3, ErrorMessage = "Username must be at least 3 characters long.")]
        public string Username { get; set; } = string.Empty;

        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}