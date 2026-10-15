using System.Text;
using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Entities;
using CodeAtlas.Infrastructure.Auth;
using CodeAtlas.Infrastructure.Chat;
using CodeAtlas.Infrastructure.Content;
using CodeAtlas.Infrastructure.Persistence;
using CodeAtlas.Infrastructure.UserData;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CodeAtlas.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<CodeAtlasDbContext>(options => options.UseSqlServer(connectionString));

        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<CodeAtlasDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<OpenAiOptions>(configuration.GetSection("OpenAi"));
        services.Configure<GeminiOptions>(configuration.GetSection("Gemini"));

        var jwtSection = configuration.GetSection("Jwt");
        var signingKey = jwtSection["SigningKey"] ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");
        var issuer = jwtSection["Issuer"] ?? string.Empty;
        var audience = jwtSection["Audience"] ?? string.Empty;

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        services.AddAuthorization();

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IUserDataService, UserDataService>();
        services.AddScoped<IChatService, ChatService>();

        var aiProvider = configuration["AiProvider"] ?? "Mock";
        if (string.Equals(aiProvider, "Gemini", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<GeminiChatService>(client => client.Timeout = TimeSpan.FromSeconds(20));
            services.AddScoped<IAiChatService>(sp => sp.GetRequiredService<GeminiChatService>());
        }
        else if (string.Equals(aiProvider, "OpenAI", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IAiChatService, OpenAiChatService>();
        }
        else
        {
            services.AddScoped<IAiChatService, MockAiChatService>();
        }

        return services;
    }
}
