using Microsoft.EntityFrameworkCore;
using Nexa.Server.DatabaseContext;
using Nexa.Server.Models;

namespace Nexa.Server.Middlewares
{
    public class DailyStreakMiddleware
    {
        private readonly RequestDelegate _next;

        public DailyStreakMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext, AppDbContext dbContext)
        {


            if(!Guid.TryParse(httpContext.Session.GetString("UserId"), out Guid userguid))
            {
               await _next(httpContext);
               return;
            }

            User? user = await dbContext.Users
            .Include(u => u.studyStatus)
            .FirstOrDefaultAsync(u => u.Id == userguid);

            if(user == null)
            {
                await _next(httpContext);
                return;
            }

            if(user.studyStatus == null) throw new InvalidOperationException("O usuário não tem studyStatus");

            DateTime hoje = DateTime.Today;
            DateTime ultimoLogin = user.studyStatus.LastLogin.Date;

            if(ultimoLogin != hoje) 
            {
                user.studyStatus.LastLogin = DateTime.Today;

                if(hoje.AddDays(-1) != ultimoLogin)
                {
                    user.studyStatus.StreakDays = 0;
                }

                user.studyStatus.StreakDays++;

                await dbContext.SaveChangesAsync();

            }

            await _next(httpContext);
                    

           
        }
    }
}