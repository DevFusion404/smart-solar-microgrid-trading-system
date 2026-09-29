// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: CustomExceptions.cs
// Description: Domain-specific exception hierarchy representing HTTP response errors.
// ===============================================

namespace backend.Middleware;

public abstract class AppException : Exception
{
    public string ErrorCode { get; }
    public int StatusCode { get; }
    public IDictionary<string, string[]>? ValidationErrors { get; }

    // Base constructor: stores the error code, HTTP status and optional per-field validation errors
    protected AppException(string errorCode, string message, int statusCode = 400, IDictionary<string, string[]>? validationErrors = null)
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
        ValidationErrors = validationErrors;
    }
}

public class BadRequestException : AppException
{
    // 400 Bad Request: invalid input or broken business rule
    public BadRequestException(string errorCode, string message, IDictionary<string, string[]>? validationErrors = null)
        : base(errorCode, message, 400, validationErrors) { }
}

public class NotFoundException : AppException
{
    // 404 Not Found: requested record does not exist
    public NotFoundException(string errorCode, string message)
        : base(errorCode, message, 404) { }
}

public class ConflictException : AppException
{
    // 409 Conflict: duplicate value or invalid state transition
    public ConflictException(string errorCode, string message)
        : base(errorCode, message, 409) { }
}

public class ForbiddenException : AppException
{
    // 403 Forbidden: authenticated but not allowed (e.g. deactivated account)
    public ForbiddenException(string errorCode, string message)
        : base(errorCode, message, 403) { }
}

public class UnauthorizedException : AppException
{
    // 401 Unauthorized: missing or wrong credentials
    public UnauthorizedException(string errorCode, string message)
        : base(errorCode, message, 401) { }
}
