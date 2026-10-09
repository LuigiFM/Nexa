using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Nexa.Server.Models;

namespace Nexa.Server.Models
{
    public class UserRegisterForm
    {
        [Required]
        [MinLength(3, ErrorMessage = "Usuário deve ter pelo menos três caracteres.")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [PasswordPropertyText]
        [MinLength(5, ErrorMessage = "Senha deve ter pelo menos cinco caracteres.")]
        public string Password { get; set; } = string.Empty;

    }

    public class UserLoginForm
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class User
    {
        [Key]
        [Required]
        public Guid Id { get; private set; } = Guid.NewGuid();

        [Required]
        [MinLength(3, ErrorMessage = "Usuário deve ter pelo menos três caracteres.")]
        public string Username { get; set; } = string.Empty;

        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [PasswordPropertyText]
        [MinLength(5, ErrorMessage = "Senha deve ter pelo menos cinco caracteres.")]
        public string Password { get; set; } = string.Empty;

        public StudyStatus studyStatus { get; set; } = new();
    }
}