using Microsoft.EntityFrameworkCore;
using Nexa.Server.DatabaseContext;
using Nexa.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.FileProviders;
using Nexa.Server.Services;
using DotNetEnv;
using Nexa.Server.Middlewares;

Env.Load();

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        policy.WithOrigins("http://127.0.0.1:5500")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

builder.Services.AddDistributedMemoryCache();

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("database"));

builder.Services.AddHttpClient<LangFlowService>();
builder.Services.AddHttpClient<GeminiService>();
builder.Services.AddScoped<PasswordHasher<User>>();



var app = builder.Build();

app.UseCors("Default");

app.UseSession();

app.UseMiddleware<DailyStreakMiddleware>();
app.MapControllers();

app.Run();