using Microsoft.EntityFrameworkCore;
using Nexa.Server.Models;
using server.Models;

namespace Nexa.Server.DatabaseContext
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
            .HasOne(User => User.studyStatus)
            .WithOne(status => status.User)
            .HasForeignKey<StudyStatus>(status => status.UserId)
            .IsRequired();
        }
    }
}