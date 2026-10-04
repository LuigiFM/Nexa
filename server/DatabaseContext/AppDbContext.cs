using Microsoft.EntityFrameworkCore;
using Nexa.Server.Models;

namespace Nexa.Server.DatabaseContext
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }

    }
}