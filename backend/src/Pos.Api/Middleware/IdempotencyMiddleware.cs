using System.Net;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;

namespace Pos.Api.Middleware;

public class IdempotencyMiddleware(RequestDelegate next)
{
  private const string HeaderName = "Idempotency-Key";

  public async Task InvokeAsync(HttpContext context, IPosDbContext db, ITenantContext tenant)
  {
    if (!ShouldProcess(context))
    {
      await next(context);
      return;
    }

    var key = context.Request.Headers[HeaderName].ToString();
    if (string.IsNullOrWhiteSpace(key) || !tenant.OrganizationId.HasValue)
    {
      await next(context);
      return;
    }

    var existing = await db.IdempotencyRecords
      .FirstOrDefaultAsync(r => r.OrganizationId == tenant.OrganizationId.Value && r.Key == key && r.ExpiresAt > DateTime.UtcNow);

    if (existing != null)
    {
      context.Response.StatusCode = existing.StatusCode;
      context.Response.ContentType = "application/json";
      await context.Response.WriteAsync(existing.ResponseBody);
      return;
    }

    var originalBody = context.Response.Body;
    await using var memory = new MemoryStream();
    context.Response.Body = memory;

    await next(context);

    memory.Seek(0, SeekOrigin.Begin);
    var body = await new StreamReader(memory).ReadToEndAsync();
    memory.Seek(0, SeekOrigin.Begin);
    await memory.CopyToAsync(originalBody);
    context.Response.Body = originalBody;

    if (context.Response.StatusCode is >= 200 and < 300)
    {
      db.IdempotencyRecords.Add(new IdempotencyRecord
      {
        OrganizationId = tenant.OrganizationId.Value,
        Key = key,
        RequestPath = context.Request.Path,
        StatusCode = context.Response.StatusCode,
        ResponseBody = body,
        ExpiresAt = DateTime.UtcNow.AddDays(1)
      });
      await db.SaveChangesAsync(context.RequestAborted);
    }
  }

  private static bool ShouldProcess(HttpContext context) =>
    HttpMethods.IsPost(context.Request.Method) ||
    HttpMethods.IsPut(context.Request.Method) ||
    HttpMethods.IsPatch(context.Request.Method);
}

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await next(context);
    }
    catch (UnauthorizedAccessException ex)
    {
      logger.LogWarning(ex, "Unauthorized request");
      await WriteError(context, HttpStatusCode.Unauthorized, ex.Message);
    }
    catch (KeyNotFoundException ex)
    {
      await WriteError(context, HttpStatusCode.NotFound, ex.Message);
    }
    catch (InvalidOperationException ex)
    {
      await WriteError(context, HttpStatusCode.BadRequest, ex.Message);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Unhandled exception");
      await WriteError(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
    }
  }

  private static async Task WriteError(HttpContext context, HttpStatusCode status, string message)
  {
    context.Response.StatusCode = (int)status;
    context.Response.ContentType = "application/json";
    var json = System.Text.Json.JsonSerializer.Serialize(new { success = false, error = message });
    await context.Response.WriteAsync(json, Encoding.UTF8);
  }
}
