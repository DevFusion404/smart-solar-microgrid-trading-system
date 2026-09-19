// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: Program.cs
// Description: Main entry point for ASP.NET Core Web API. Configures services, MongoDB, JWT authentication, CORS policies, and HTTP pipeline.
// ===============================================

using backend.Authorization;
using backend.Configuration;
using backend.Data;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using System.Text;
using backend.Interfaces;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Configuration ───────────────────────────────────────────────────────────
builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Bind MongoDB settings
var mongoDbSettings = builder.Configuration
    .GetSection(MongoDbSettings.SectionName)
    .Get<MongoDbSettings>()
    ?? throw new InvalidOperationException($"Missing configuration section '{MongoDbSettings.SectionName}'.");

// Bind JWT settings
var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException($"Missing configuration section '{JwtSettings.SectionName}'.");

if (string.IsNullOrEmpty(jwtSettings.SecretKey) || jwtSettings.SecretKey.Contains("OVERRIDE"))
{
    // Provide fallback dev key if not specified
    jwtSettings.SecretKey = "SmartSolarMicrogrid_SuperSecretDevelopmentKey_Minimum256BitsLongKey_2026!";
}

// ─── Services Registration ───────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger setup with JWT Bearer authentication support and XML comments
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Smart Solar Microgrid Trading System API",
        Version = "v1",
        Description = "Backend REST API for User & Account Management"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid JWT token.\n\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Operation filter to automatically append required roles to every endpoint in Swagger UI
    options.OperationFilter<SwaggerAuthorizeOperationFilter>();

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Register Microgrid Services
builder.Services.AddScoped<IMicrogridStationService, MicrogridStationService>();
builder.Services.AddScoped<IEnergySlotService, EnergySlotService>();
builder.Services.AddScoped<INodeAssignmentService, NodeAssignmentService>();

// Register Configuration Singletons
builder.Services.AddSingleton(mongoDbSettings);
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<MongoDbContext>().Database);

// Register Helpers & Utilities
builder.Services.AddSingleton<IPasswordHasher<UserDetails>, PasswordHasher<UserDetails>>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddSingleton<IQrCodeGenerator, QrCodeGenerator>();

// Register Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Energy Transfer and Transaction Management repositories
builder.Services.AddScoped<IEnergyTransactionRepository, EnergyTransactionRepository>();
builder.Services.AddScoped<IReservationLookupRepository, ReservationLookupRepository>();

// Register Domain Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IWebUserService, WebUserService>();
builder.Services.AddScoped<IProsumerService, ProsumerService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IEnergyTransactionService, EnergyTransactionService>();

// Register Authorization Handlers
builder.Services.AddSingleton<IAuthorizationHandler, NicOwnershipHandler>();

// ─── Authentication & Authorization Setup ───────────────────────────────────
var key = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("NicOwnershipPolicy", policy =>
        policy.Requirements.Add(new NicOwnershipRequirement()));
});

// CORS Policy Setup for React Frontend and Android Native API Clients
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── Application Pipeline ────────────────────────────────────────────────────
var app = builder.Build();

// Global Exception Middleware Envelope
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var httpsUrl = app.Urls.FirstOrDefault(u => u.StartsWith("https://"))
               ?? builder.Configuration["ASPNETCORE_URLS"]?.Split(';')
                         .FirstOrDefault(u => u.StartsWith("https://"));

if (!string.IsNullOrEmpty(httpsUrl) || !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ─── DB Health Check ──────────────────────────────────────────────────────────
app.MapGet("/health/db", async (MongoDbContext db) =>
{
    try
    {
        var ping = await db.Database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
            new MongoDB.Bson.BsonDocument("ping", 1));

        return Results.Ok(new
        {
            status = "connected",
            database = db.Database.DatabaseNamespace.DatabaseName,
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "MongoDB connection failed",
            detail: ex.Message,
            statusCode: 503);
    }
})
.WithName("DbHealthCheck")
.WithTags("Health")
.WithOpenApi();

app.Run();
