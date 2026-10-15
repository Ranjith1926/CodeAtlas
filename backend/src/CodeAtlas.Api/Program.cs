using CodeAtlas.Api.Middleware;
using CodeAtlas.Infrastructure;
using CodeAtlas.Infrastructure.Persistence;
using CodeAtlas.Infrastructure.Seeding;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "CodeAtlas API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

// Local-dev-only permissive CORS policy so the Expo app (any LAN IP / port) can reach this API.
// Do NOT use a policy this permissive in a production deployment.
const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger UI is always enabled (incl. under IIS, which doesn't set ASPNETCORE_ENVIRONMENT=Development)
// since this API is only ever reachable on a local/trusted network in this walking-skeleton deployment.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "CodeAtlas API v1");
});

// HTTPS redirection is skipped entirely for local dev: Android emulator cleartext HTTP to a dev
// server is simpler than trusting a dev cert, and Kestrel is fixed to a single HTTP endpoint anyway.

app.UseCors(DevCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Always auto-migrate/seed (incl. under IIS) — this is a local/trusted test deployment, not a
// production hosting scenario with a separate migration pipeline.
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CodeAtlasDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    logger.LogInformation("Applying EF Core migrations...");
    await db.Database.MigrateAsync();

    logger.LogInformation("Seeding database if empty...");
    await DbSeeder.SeedAsync(db, logger);
}

app.Run();
