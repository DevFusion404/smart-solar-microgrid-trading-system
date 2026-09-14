// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ExceptionHandlingMiddleware.cs
// Description: Global ASP.NET Core middleware intercepting uncaught exceptions into standardized JSON error responses.
// ===============================================

using backend.DTOs.Common;
using System.Text.Json;

namespace backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // Intercepts request execution and catches application or unhandled server exceptions
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            _logger.LogWarning(ex, "Application exception caught: {ErrorCode} - {Message}", ex.ErrorCode, ex.Message);
            await HandleExceptionAsync(context, ex.StatusCode, ex.ErrorCode, ex.Message, ex.ValidationErrors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled server exception occurred.");
            await HandleExceptionAsync(context, 500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred. Please try again later.");
        }
    }

    // Formats and writes standardized JSON error response body to HttpContext response
    private static Task HandleExceptionAsync(HttpContext context, int statusCode, string errorCode, string message, IDictionary<string, string[]>? validationErrors = null)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new ApiErrorResponse
        {
            ErrorCode = errorCode,
            Message = message,
            ValidationErrors = validationErrors,
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
