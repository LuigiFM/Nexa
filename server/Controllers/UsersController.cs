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


namespace Nexa.Server.Controllers
{
    [ApiController]
    [Route("Users")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public UsersController(AppDbContext context, PasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (_context.Users.Any(u => u.Username == user.Username || u.Email == user.Email))
            {
                return Conflict("Usuário ou email já existe.");
            }

            user.Password = _passwordHasher.HashPassword(user, user.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User user)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == user.Username);

            if (existingUser == null)
            {
                return NotFound("Usuário não encontrado.");
            }

            var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(existingUser, existingUser.Password, user.Password);
            
            if (passwordVerificationResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Credenciais inválidas.");
            }

            HttpContext.Session.SetString("UserId", existingUser.Id.ToString());

            return Ok("Login bem-sucedido.");
        }



        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            List<User> users = await _context.Users.ToListAsync();

            foreach (var user in users)
            {
                user.Password = string.Empty; // Remove the password before returning the user data
            }
            return Ok(users);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdString = HttpContext.Session.GetString("UserId");

            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized("Usuário não autenticado.");
            }


            User? user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("Usuário não encontrado.");
            }

            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email
            });
        }

        [HttpDelete("logout")]
        public IActionResult Logout()
        {
            HttpContext.Session.Remove("UserId");
            return Ok("Logout bem-sucedido.");
        }
    }
}