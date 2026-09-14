// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: SwaggerAuthorizeOperationFilter.cs
// Description: Swagger operation filter appending required roles and security documentation to OpenAPI UI.
// ===============================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace backend.Helpers;

public class SwaggerAuthorizeOperationFilter : IOperationFilter
{
    // Applies authorization requirement tags and HTTP status code responses to Swagger endpoints
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var methodAttributes = context.MethodInfo.GetCustomAttributes(true);
        var controllerAttributes = context.MethodInfo.DeclaringType?.GetCustomAttributes(true) ?? Array.Empty<object>();

        var isAnonymous = methodAttributes.OfType<AllowAnonymousAttribute>().Any();
        if (isAnonymous)
        {
            operation.Description = $"**🔒 Required Role:** `Public (Unauthenticated)`\n\n{operation.Description}";
            return;
        }

        var authorizeAttributes = methodAttributes.OfType<AuthorizeAttribute>()
            .Concat(controllerAttributes.OfType<AuthorizeAttribute>())
            .ToList();

        if (!authorizeAttributes.Any())
        {
            operation.Description = $"**🔒 Required Role:** `Public (Unauthenticated)`\n\n{operation.Description}";
            return;
        }

        var roles = authorizeAttributes
            .Where(a => !string.IsNullOrEmpty(a.Roles))
            .Select(a => a.Roles)
            .Distinct()
            .ToList();

        var policies = authorizeAttributes
            .Where(a => !string.IsNullOrEmpty(a.Policy))
            .Select(a => a.Policy)
            .Distinct()
            .ToList();

        string roleDescription;

        if (policies.Contains("NicOwnershipPolicy"))
        {
            roleDescription = "`Active Prosumer (Own NIC only)` OR `Backoffice` / `GridOperator`";
        }
        else if (roles.Any())
        {
            roleDescription = string.Join(" OR ", roles.Select(r => $"`{r}`"));
        }
        else
        {
            roleDescription = "`All Authenticated Users` (Backoffice, GridOperator, Prosumer)";
        }

        operation.Description = $"**🔒 Required Role:** {roleDescription}\n\n{operation.Description}";

        // Add 401 and 403 standard response descriptions to Swagger UI
        if (!operation.Responses.ContainsKey("401"))
        {
            operation.Responses.Add("401", new OpenApiResponse { Description = "Unauthorized — Invalid or missing Bearer token." });
        }
        if (!operation.Responses.ContainsKey("403"))
        {
            operation.Responses.Add("403", new OpenApiResponse { Description = "Forbidden — User role does not have permission to access this resource." });
        }
    }
}
