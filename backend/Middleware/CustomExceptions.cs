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
    public BadRequestException(string errorCode, string message, IDictionary<string, string[]>? validationErrors = null)
        : base(errorCode, message, 400, validationErrors) { }
}

public class NotFoundException : AppException
{
    public NotFoundException(string errorCode, string message)
        : base(errorCode, message, 404) { }
}

public class ConflictException : AppException
{
    public ConflictException(string errorCode, string message)
        : base(errorCode, message, 409) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string errorCode, string message)
        : base(errorCode, message, 403) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string errorCode, string message)
        : base(errorCode, message, 401) { }
}
