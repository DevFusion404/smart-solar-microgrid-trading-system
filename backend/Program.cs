using backend.Configuration;
using backend.Data;
using MongoDB.Driver;
using backend.Interfaces;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Register microgrid station service

// ─── Configuration ───────────────────────────────────────────────────────────
// Priority (highest → lowest):
//  1. Environment variables  (e.g. MONGODBSETTINGS__CONNECTIONSTRING)
//  2. appsettings.Local.json (gitignored, for local dev secrets)
//  3. appsettings.{Environment}.json
//  4. appsettings.json       (schema / non-secret defaults)
builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Bind and validate MongoDB settings
var mongoDbSettings = builder.Configuration
    .GetSection(MongoDbSettings.SectionName)
    .Get<MongoDbSettings>()
    ?? throw new InvalidOperationException(
        $"Missing configuration section '{MongoDbSettings.SectionName}'. " +
        "Add it to appsettings.Local.json or set the MONGODBSETTINGS__CONNECTIONSTRING environment variable.");

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFile =
        $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";

    var xmlPath =
        Path.Combine(AppContext.BaseDirectory, xmlFile);

    options.IncludeXmlComments(xmlPath);
});
builder.Services.AddControllers();

builder.Services.AddScoped<IMicrogridStationService, MicrogridStationService>();
builder.Services.AddScoped<IEnergySlotService, EnergySlotService>();


// Register MongoDB settings as a singleton
builder.Services.AddSingleton(mongoDbSettings);

// Register MongoDbContext as a singleton (MongoClient manages its own connection pool)
builder.Services.AddSingleton<MongoDbContext>();

// Optionally expose IMongoDatabase directly if individual services need it
builder.Services.AddSingleton<IMongoDatabase>(sp =>
    sp.GetRequiredService<MongoDbContext>().Database);

// ─── Pipeline ─────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only redirect to HTTPS when an HTTPS URL is actually configured.
// Avoids the "Failed to determine the https port" warning when running
// the HTTP-only launch profile during local development.
var httpsUrl = app.Urls.FirstOrDefault(u => u.StartsWith("https://"))
               ?? builder.Configuration["ASPNETCORE_URLS"]?.Split(';')
                         .FirstOrDefault(u => u.StartsWith("https://"));

if (!string.IsNullOrEmpty(httpsUrl) || !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.MapControllers();

// ─── DB Health Check ──────────────────────────────────────────────────────────
app.MapGet("/health/db", async (MongoDbContext db) =>
{
    try
    {
        // Ping the MongoDB deployment — throws if unreachable
        var ping = await db.Database.RunCommandAsync<MongoDB.Bson.BsonDocument>(
            new MongoDB.Bson.BsonDocument("ping", 1));

        return Results.Ok(new
        {
            status    = "connected",
            database  = db.Database.DatabaseNamespace.DatabaseName,
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title:      "MongoDB connection failed",
            detail:     ex.Message,
            statusCode: 503);
    }
})
.WithName("DbHealthCheck")
.WithTags("Health")
.WithOpenApi();

app.Run();
