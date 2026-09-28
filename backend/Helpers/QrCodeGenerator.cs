/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : QrCodeGenerator.cs
Description   : Helper responsible for minting secure transaction
                tokens and rendering them as scannable QR images.
Author        : Malmi
=====================================================
*/

using QRCoder;
using System.Security.Cryptography;
using System.Text.Json;

namespace backend.Helpers;

/// <summary>
/// Creates the secure token that identifies a transaction and renders it as a QR image.
/// </summary>
public interface IQrCodeGenerator
{
    /// <summary>
    /// Generates a cryptographically random, URL-safe token.
    /// </summary>
    /// <returns>A token with roughly 160 bits of entropy.</returns>
    string GenerateSecureToken();

    /// <summary>
    /// Builds the exact JSON payload that gets encoded into the QR image.
    /// Only the token is included — never any personal data.
    /// </summary>
    /// <param name="token">The transaction token.</param>
    /// <returns>A compact JSON document carrying only the token.</returns>
    string BuildPayload(string token);

    /// <summary>
    /// Renders a QR image for the given payload.
    /// </summary>
    /// <param name="payload">Text to encode, normally the output of <see cref="BuildPayload"/>.</param>
    /// <param name="pixelsPerModule">Size of each QR module in pixels. Larger means a bigger image.</param>
    /// <returns>A <c>data:image/png;base64,</c> URI that an img tag can render directly.</returns>
    string GenerateQrImageDataUri(string payload, int pixelsPerModule = 10);

    /// <summary>
    /// Extracts the token from whatever the scanner submitted. Mobile scanners may
    /// return the full JSON payload or just the raw token, so both are accepted.
    /// </summary>
    /// <param name="scannedValue">The raw string produced by the scanner.</param>
    /// <returns>The bare token, or null when nothing usable could be read.</returns>
    string? ExtractToken(string? scannedValue);
}

/// <summary>
/// QRCoder backed implementation. <see cref="PngByteQRCode"/> is used rather than
/// the bitmap renderers because it has no System.Drawing dependency and therefore
/// runs unchanged on Windows, Linux and container hosts.
/// </summary>
public class QrCodeGenerator : IQrCodeGenerator
{
    /// <summary>Property name used inside the QR JSON payload.</summary>
    private const string TokenPropertyName = "transactionToken";

    /// <inheritdoc />
    public string GenerateSecureToken()
    {
        // 20 random bytes -> 160 bits of entropy, far beyond guessable.
        var buffer = RandomNumberGenerator.GetBytes(20);

        // Base64Url keeps the token short and safe inside JSON, URLs and QR payloads.
        return Convert.ToBase64String(buffer)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    /// <inheritdoc />
    public string BuildPayload(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new ArgumentException("A token is required to build a QR payload.", nameof(token));
        }

        // Serialising through JsonSerializer guarantees the payload is always valid JSON.
        return JsonSerializer.Serialize(new Dictionary<string, string>
        {
            [TokenPropertyName] = token
        });
    }

    /// <inheritdoc />
    public string GenerateQrImageDataUri(string payload, int pixelsPerModule = 10)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            throw new ArgumentException("A payload is required to render a QR image.", nameof(payload));
        }

        // Keep the rendered image within sensible bounds for both web and mobile.
        pixelsPerModule = Math.Clamp(pixelsPerModule, 4, 20);

        // ECC level Q tolerates roughly 25% damage, which matters for a screen
        // being photographed by a handheld scanner in daylight.
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);

        var png = new PngByteQRCode(data).GetGraphic(pixelsPerModule);

        return $"data:image/png;base64,{Convert.ToBase64String(png)}";
    }

    /// <inheritdoc />
    public string? ExtractToken(string? scannedValue)
    {
        if (string.IsNullOrWhiteSpace(scannedValue))
        {
            return null;
        }

        var trimmed = scannedValue.Trim();

        // A JSON payload from the QR image: read the token property out of it.
        if (trimmed.StartsWith('{'))
        {
            try
            {
                using var document = JsonDocument.Parse(trimmed);

                foreach (var property in document.RootElement.EnumerateObject())
                {
                    // Accept any casing so third-party scanners are not a problem.
                    if (string.Equals(property.Name, TokenPropertyName, StringComparison.OrdinalIgnoreCase) &&
                        property.Value.ValueKind == JsonValueKind.String)
                    {
                        var token = property.Value.GetString();
                        return string.IsNullOrWhiteSpace(token) ? null : token.Trim();
                    }
                }

                // Well-formed JSON without the expected property is not a valid QR.
                return null;
            }
            catch (JsonException)
            {
                // Malformed JSON — treat the whole string as unusable.
                return null;
            }
        }

        // Otherwise the scanner handed back the bare token.
        return trimmed;
    }
}
